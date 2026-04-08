use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::{HashMap, VecDeque};
use std::io::Read;
use std::net::{Ipv4Addr, SocketAddrV4, TcpListener};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use sysinfo::System;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, Debug, Serialize)]
pub struct NodeStatus {
    pub started_at: u64,
    pub status: String,
    pub is_active: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunningNodeDescriptor {
    pub network_id: String,
    pub environment: String,
    pub node_preset_id: String,
    pub started_at: u64,
}

struct NodeEntry {
    app: AppHandle,
    _child: Child,
    network_id: String,
    environment: String,
    node_preset_id: String,
}

lazy_static::lazy_static! {
    static ref ACTIVE_NODES: Mutex<HashMap<String, NodeEntry>> = Mutex::new(HashMap::new());
    static ref NODE_STATS: Mutex<HashMap<String, NodeStatus>> = Mutex::new(HashMap::new());
    static ref NODE_LOG_RING: Mutex<HashMap<String, VecDeque<NodeLogLineEntry>>> = Mutex::new(HashMap::new());
}

const NODE_LOG_LINE_MAX: usize = 8192;
const NODE_LOG_RING_MAX: usize = 500;
/// Flush a partial line when the pipe stays block-buffered (no newline) for this many bytes.
const NODE_LOG_CARRY_FLUSH_MAX: usize = 48 * 1024;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeLogLineEntry {
    pub stream: String,
    pub line: String,
}

fn truncate_log_line(s: &str) -> String {
    if s.len() <= NODE_LOG_LINE_MAX {
        s.to_string()
    } else {
        format!("{}…", &s[..NODE_LOG_LINE_MAX.saturating_sub(3)])
    }
}

fn push_node_log_ring(ring_key: &str, stream: &str, line: String) {
    let entry = NodeLogLineEntry {
        stream: stream.to_string(),
        line,
    };
    if let Ok(mut m) = NODE_LOG_RING.lock() {
        let dq = m
            .entry(ring_key.to_string())
            .or_insert_with(|| VecDeque::with_capacity(NODE_LOG_RING_MAX));
        dq.push_back(entry);
        while dq.len() > NODE_LOG_RING_MAX {
            dq.pop_front();
        }
    }
}

fn clear_node_log_ring(ring_key: &str) {
    if let Ok(mut m) = NODE_LOG_RING.lock() {
        m.remove(ring_key);
    }
}

fn emit_node_log_to_main(app: &AppHandle, payload: serde_json::Value) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.emit("node-process-output", &payload);
    } else {
        let _ = app.emit("node-process-output", payload);
    }
}

fn emit_and_store_node_log_line(
    app: &AppHandle,
    ring_key: &str,
    network_id: &str,
    environment: &str,
    node_preset_id: &str,
    stream: &str,
    line: String,
) {
    let t = truncate_log_line(&line);
    push_node_log_ring(ring_key, stream, t.clone());
    emit_node_log_to_main(
        app,
        serde_json::json!({
            "networkId": network_id,
            "environment": environment,
            "nodePresetId": node_preset_id,
            "stream": stream,
            "line": t,
        }),
    );
}

/// Recent log lines for the main webview (remote URL loads miss early `listen` events).
pub fn get_node_log_snapshot(
    network_id: &str,
    environment: &str,
    node_preset_id: &str,
) -> Vec<NodeLogLineEntry> {
    let key = process_key(network_id, environment, node_preset_id);
    NODE_LOG_RING
        .lock()
        .ok()
        .map(|m| {
            m.get(&key)
                .map(|dq| dq.iter().cloned().collect())
                .unwrap_or_default()
        })
        .unwrap_or_default()
}

/// Read stdout/stderr in chunks so block-buffered binaries still produce output before a newline.
fn forward_pipe_to_logs<R: Read + Send + 'static>(
    app: AppHandle,
    ring_key: String,
    network_id: String,
    environment: String,
    node_preset_id: String,
    stream: &'static str,
    mut reader: R,
) {
    std::thread::spawn(move || {
        let mut carry = String::new();
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    carry.push_str(&String::from_utf8_lossy(&buf[..n]));
                    while let Some(pos) = carry.find('\n') {
                        let mut line = carry[..pos].to_string();
                        carry.drain(..=pos);
                        if line.ends_with('\r') {
                            line.pop();
                        }
                        emit_and_store_node_log_line(
                            &app,
                            &ring_key,
                            &network_id,
                            &environment,
                            &node_preset_id,
                            stream,
                            line,
                        );
                    }
                    if carry.len() > NODE_LOG_CARRY_FLUSH_MAX {
                        let chunk = std::mem::take(&mut carry);
                        emit_and_store_node_log_line(
                            &app,
                            &ring_key,
                            &network_id,
                            &environment,
                            &node_preset_id,
                            stream,
                            chunk,
                        );
                    }
                }
                Err(_) => break,
            }
        }
        let tail = carry.trim_end_matches(['\r', '\n']).to_string();
        if !tail.is_empty() {
            emit_and_store_node_log_line(
                &app,
                &ring_key,
                &network_id,
                &environment,
                &node_preset_id,
                stream,
                tail,
            );
        }
    });
}

fn mark_node_stats_inactive(key: &str) {
    if let Ok(mut stats) = NODE_STATS.lock() {
        if let Some(s) = stats.get_mut(key) {
            s.is_active = false;
        }
    }
}

/// Drop finished children so `list_running_nodes` / UI match reality (e.g. user closed an external console).
fn reap_exited_node_children() {
    let Ok(mut nodes) = ACTIVE_NODES.lock() else {
        return;
    };
    nodes.retain(|key, entry| {
        match entry._child.try_wait() {
            Ok(Some(status)) => {
                // Pipe reader threads may still be draining OS buffers; fast exits can otherwise race
                // and the UI only shows the exit meta line with no stderr context.
                std::thread::sleep(Duration::from_millis(450));
                let exit_msg = if let Some(code) = status.code() {
                    format!("Process exited with code {code}")
                } else {
                    "Process exited".to_string()
                };
                emit_and_store_node_log_line(
                    &entry.app,
                    key,
                    &entry.network_id,
                    &entry.environment,
                    &entry.node_preset_id,
                    "meta",
                    exit_msg,
                );
                mark_node_stats_inactive(key);
                false
            }
            Ok(None) => true,
            Err(_) => {
                mark_node_stats_inactive(key);
                false
            }
        }
    });
}

/// Lowercase path string comparable across `canonicalize()` (`\\?\` on Windows) vs `Process::exe()` forms.
fn normalize_path_for_prefix_match(p: &Path) -> String {
    let mut s = p.to_string_lossy().to_lowercase().replace('/', "\\");
    if let Some(rest) = s.strip_prefix("\\\\?\\") {
        s = rest.to_string();
        if let Some(unc) = s.strip_prefix("unc\\") {
            s = format!("\\\\{unc}");
        }
    }
    s
}

/// Kill processes whose executable lives under `dir` (VibeMiner node cache layout: `.../nodes/<key>/bin/.../*.exe`).
/// Catches orphans when the in-memory [`Child`] handle was lost (app restart, UI desync) but the binary keeps running.
///
/// On Windows, `Process::exe()` is sometimes empty until refreshed or differs from `canonicalize()` prefixes;
/// we also match the command line against the cache folder name (e.g. `devnet__boing-devnet`).
fn kill_processes_executables_under(dir: &Path) -> u32 {
    if !sysinfo::IS_SUPPORTED_SYSTEM {
        return 0;
    }
    let Ok(canonical) = dir.canonicalize() else {
        return 0;
    };
    let prefix = normalize_path_for_prefix_match(&canonical);
    let dir_marker = dir
        .file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_lowercase())
        .filter(|s| s.len() >= 4)
        .unwrap_or_default();
    let mut system = System::new_all();
    system.refresh_all();
    let mut killed = 0u32;
    for process in system.processes().values() {
        let mut matched = false;
        if let Some(exe) = process.exe() {
            let p = normalize_path_for_prefix_match(exe);
            if p.starts_with(&prefix) {
                matched = true;
            }
        }
        if !matched && !dir_marker.is_empty() {
            let cmd = process.cmd().join(" ").to_lowercase();
            if cmd.contains(&dir_marker) {
                matched = true;
            }
        }
        if matched && process.kill() {
            killed += 1;
        }
    }
    killed
}

/// On app exit: stop every node binary still running from our `nodes/` download cache.
pub fn stop_all_cached_node_processes(user_data: &Path) {
    let nodes_root = user_data.join("nodes");
    let Ok(entries) = std::fs::read_dir(&nodes_root) else {
        return;
    };
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() {
            kill_processes_executables_under(&path);
        }
    }
}

/// Stop tracked nodes (normal path) then sweep the cache for any remaining executables (orphans).
pub fn shutdown_all_node_processes(user_data: &Path) {
    let snapshot: Vec<(String, String, String)> = if let Ok(nodes) = ACTIVE_NODES.lock() {
        nodes
            .values()
            .map(|e| {
                (
                    e.network_id.clone(),
                    e.environment.clone(),
                    e.node_preset_id.clone(),
                )
            })
            .collect()
    } else {
        Vec::new()
    };
    for (network_id, environment, preset) in snapshot {
        stop_node(Some(user_data), &network_id, &environment, &preset);
    }
    stop_all_cached_node_processes(user_data);
}

/// Folder name under `nodes/`. Cannot contain `:` — Windows rejects it in a path component (os error 123).
fn node_dir_key(network_id: &str, environment: &str) -> String {
    let sanitize = |s: &str| {
        s.chars()
            .map(|c| match c {
                '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '-',
                c if c.is_control() => '-',
                c => c,
            })
            .collect::<String>()
    };
    format!("{}__{}", sanitize(environment), sanitize(network_id))
}

fn legacy_node_dir_key(network_id: &str, environment: &str) -> String {
    format!("{}:{}", environment, network_id)
}

fn sanitize_preset_id(raw: &str) -> String {
    let t = raw.trim().to_lowercase();
    if t.is_empty() {
        return "default".to_string();
    }
    let mut out = String::new();
    for c in t.chars() {
        if c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' {
            out.push(c);
        } else if !out.is_empty() && !out.ends_with('-') {
            out.push('-');
        }
    }
    let out = out.trim_matches('-').to_string();
    if out.is_empty() {
        "default".to_string()
    } else {
        out
    }
}

fn process_key(network_id: &str, environment: &str, preset_raw: &str) -> String {
    let p = sanitize_preset_id(preset_raw);
    format!("{}:{}:{}", environment, network_id, p)
}

fn sha256_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

/// Stable subdirectory name for this download URL so different OS archives never share one `bin/`.
/// Includes the desktop app version so upgrading VibeMiner re-fetches zips even when the URL is unchanged
/// (avoids stale `boing-node` after same-tag zip replacements or QA RPC additions).
fn node_download_cache_key(url: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    hasher.update(b"\xffvm-app\xff");
    hasher.update(env!("CARGO_PKG_VERSION").as_bytes());
    let full: String = format!("{:x}", hasher.finalize());
    full.chars().take(16).collect()
}

/// Env: absolute path to a `boing-node` binary. When set, VibeMiner **skips** the zip download for
/// networks whose id contains `"boing"` and runs this executable (use a `cargo build -p boing-node`
/// binary from current Boing `main` when GitHub releases lag).
pub const VIBEMINER_BOING_NODE_EXE_ENV: &str = "VIBEMINER_BOING_NODE_EXE";

pub fn boing_local_exe_from_env(network_id: &str) -> Result<Option<std::path::PathBuf>, String> {
    let raw = match std::env::var(VIBEMINER_BOING_NODE_EXE_ENV) {
        Ok(s) => s,
        Err(_) => return Ok(None),
    };
    let t = raw.trim();
    if t.is_empty() {
        return Ok(None);
    }
    if !network_id.to_lowercase().contains("boing") {
        return Ok(None);
    }
    let p = std::path::PathBuf::from(t);
    if !p.is_absolute() {
        return Err(format!(
            "{VIBEMINER_BOING_NODE_EXE_ENV} must be an absolute path (got {t})"
        ));
    }
    if !p.exists() {
        return Err(format!(
            "{VIBEMINER_BOING_NODE_EXE_ENV} file not found: {}",
            p.display()
        ));
    }
    Ok(Some(p))
}

pub fn ensure_local_boing_node_paths(
    network_id: &str,
    environment: &str,
    node_preset_id: &str,
    user_data_path: &Path,
    local_exe: &Path,
) -> Result<(std::path::PathBuf, std::path::PathBuf), String> {
    let key = node_dir_key(network_id, environment);
    let node_dir = user_data_path.join("nodes").join(&key);
    let legacy_dir = user_data_path
        .join("nodes")
        .join(legacy_node_dir_key(network_id, environment));
    if !node_dir.exists() && legacy_dir.exists() {
        let _ = std::fs::rename(&legacy_dir, &node_dir);
    }
    let preset_safe = sanitize_preset_id(node_preset_id);
    let data_dir = node_dir.join("data").join(&preset_safe);
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let bin_dir = local_exe
        .parent()
        .ok_or_else(|| "Local boing-node path has no parent directory".to_string())?
        .to_path_buf();
    Ok((bin_dir, data_dir))
}

pub fn ensure_node_ready(
    network_id: &str,
    environment: &str,
    node_preset_id: &str,
    node_download_url: &str,
    node_binary_sha256: Option<&str>,
    user_data_path: &Path,
    mut on_progress: impl FnMut(&str, u32, &str),
) -> Result<(std::path::PathBuf, std::path::PathBuf), String> {
    let key = node_dir_key(network_id, environment);
    let node_dir = user_data_path.join("nodes").join(&key);
    let legacy_dir = user_data_path
        .join("nodes")
        .join(legacy_node_dir_key(network_id, environment));
    if !node_dir.exists() && legacy_dir.exists() {
        let _ = std::fs::rename(&legacy_dir, &node_dir);
    }
    let preset_safe = sanitize_preset_id(node_preset_id);
    let data_dir = node_dir.join("data").join(&preset_safe);

    if node_download_url.is_empty() {
        return Err("No node download URL".into());
    }

    let url_key = node_download_cache_key(node_download_url);
    let ready_dir = node_dir.join(".vm-ready");
    let ready_marker = ready_dir.join(format!("{url_key}.ok"));
    let bin_dir = node_dir.join("bin").join(&url_key);

    if ready_marker.exists() && bin_dir.is_dir() {
        std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
        return Ok((bin_dir, data_dir));
    }

    on_progress("fetching", 0, "Downloading node…");
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let staging = node_dir.join(".staging").join(&url_key);
    let archive_path = staging.join("archive");
    let extract_path = staging.join("extract");
    std::fs::create_dir_all(&staging).map_err(|e| e.to_string())?;

    let client = reqwest::blocking::Client::builder()
        .user_agent("VibeMiner/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let bytes = client
        .get(node_download_url)
        .header("Accept", "application/octet-stream")
        .send()
        .map_err(|e| e.to_string())?
        .bytes()
        .map_err(|e| e.to_string())?;
    std::fs::write(&archive_path, &bytes).map_err(|e| e.to_string())?;

    if let Some(expected) = node_binary_sha256 {
        if expected.len() == 64 && expected.chars().all(|c| c.is_ascii_hexdigit()) {
            let actual = sha256_bytes(&bytes);
            if actual.to_lowercase() != expected.to_lowercase() {
                let _ = std::fs::remove_file(&archive_path);
                return Err("Integrity check failed: SHA256 mismatch".into());
            }
        }
    }

    on_progress("extracting", 50, "Extracting…");
    std::fs::create_dir_all(&extract_path).map_err(|e| e.to_string())?;
    let url_lower = node_download_url.to_lowercase();
    if url_lower.ends_with(".zip") {
        let file = std::fs::File::open(&archive_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let outpath = extract_path.join(file.name());
            if file.name().ends_with('/') {
                std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
            } else {
                if let Some(p) = outpath.parent() {
                    std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
                let mut outfile = std::fs::File::create(&outpath).map_err(|e| e.to_string())?;
                std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            }
        }
    } else if url_lower.ends_with(".tar.gz") || url_lower.ends_with(".tgz") {
        let file = std::fs::File::open(&archive_path).map_err(|e| e.to_string())?;
        let dec = flate2::read::GzDecoder::new(file);
        let mut archive = tar::Archive::new(dec);
        archive.unpack(&extract_path).map_err(|e| e.to_string())?;
    } else {
        let name = std::path::Path::new(node_download_url)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("binary");
        std::fs::copy(&archive_path, extract_path.join(name)).map_err(|e| e.to_string())?;
    }
    let _ = std::fs::remove_file(&archive_path);

    let entries: Vec<_> = std::fs::read_dir(&extract_path)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();
    let subdir = entries.iter().find(|e| e.path().is_dir());
    let src_dir = subdir
        .map(|e| e.path())
        .unwrap_or_else(|| extract_path.clone());
    if bin_dir.exists() {
        std::fs::remove_dir_all(&bin_dir).map_err(|e| e.to_string())?;
    }
    if let Some(parent) = bin_dir.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::rename(&src_dir, &bin_dir).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_dir_all(&extract_path);
    std::fs::create_dir_all(&ready_dir).map_err(|e| e.to_string())?;
    std::fs::write(&ready_marker, "").map_err(|e| e.to_string())?;
    let _ = std::fs::remove_dir_all(&staging);
    on_progress("ready", 100, "Node ready");
    Ok((bin_dir, data_dir))
}

/// Quote paths that contain whitespace so a single shell-style token survives splitting.
fn quote_path_token(path: &str) -> String {
    if path.chars().any(|c| c.is_whitespace()) {
        format!("\"{}\"", path.replace('"', ""))
    } else {
        path.to_string()
    }
}

/// Split a command line respecting double-quoted segments (paths with spaces).
fn split_command_args(input: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    for ch in input.chars() {
        match ch {
            '"' => in_quotes = !in_quotes,
            w if w.is_whitespace() && !in_quotes => {
                if !current.is_empty() {
                    out.push(unquote_token(&current));
                    current.clear();
                }
            }
            c => current.push(c),
        }
    }
    if !current.is_empty() {
        out.push(unquote_token(&current));
    }
    out
}

fn unquote_token(s: &str) -> String {
    let t = s.trim();
    if t.len() >= 2 && t.starts_with('"') && t.ends_with('"') {
        t[1..t.len() - 1].to_string()
    } else {
        t.to_string()
    }
}

/// Replace the first token of `node_command_template` with `new_exe` (quoted when needed).
pub fn replace_command_template_exe(template: &str, new_exe: &Path) -> Result<String, String> {
    let parts = split_command_args(template);
    if parts.is_empty() {
        return Err("Empty command template".into());
    }
    let exe_q = quote_path_token(&new_exe.to_string_lossy());
    let mut out = exe_q;
    for a in parts.iter().skip(1) {
        let piece = if a.chars().any(|c| c.is_whitespace()) {
            quote_path_token(a)
        } else {
            a.clone()
        };
        out.push(' ');
        out.push_str(&piece);
    }
    Ok(out)
}

/// Parse `--rpc-port` / `--rpc-port=NN` from argv (matches common node CLIs, including Boing).
fn rpc_port_from_args(args: &[String]) -> Option<u16> {
    let mut it = args.iter();
    while let Some(a) = it.next() {
        if let Some(rest) = a.strip_prefix("--rpc-port=") {
            return rest.parse().ok();
        }
        if a == "--rpc-port" {
            return it.next().and_then(|s| s.parse().ok());
        }
    }
    None
}

/// Boing node defaults JSON-RPC to 8545 when `--rpc-port` is omitted (`main.rs` `default_value = "8545"`).
fn effective_rpc_port_for_preflight(network_id: &str, args: &[String]) -> Option<u16> {
    if let Some(p) = rpc_port_from_args(args) {
        return Some(p);
    }
    if network_id.to_lowercase().contains("boing") {
        return Some(8545);
    }
    None
}

/// Fail fast with a clear message when the RPC port cannot be bound (Boing exits with code 1 almost immediately).
fn preflight_rpc_listen_port(port: u16) -> Result<(), String> {
    let addr = SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, port);
    match TcpListener::bind(addr) {
        Ok(l) => drop(l),
        Err(e) => {
            return Err(format!(
                "RPC port {port} is not available ({e}). Another process is probably using it (another Boing node, Hardhat, Anvil, etc.). Stop it or change --rpc-port in the network command template."
            ));
        }
    }
    Ok(())
}

fn resolve_node_executable(bin_dir: &Path, exe_token: &str) -> Result<std::path::PathBuf, String> {
    let clean = unquote_token(exe_token);
    let p = if Path::new(&clean).is_absolute() {
        std::path::PathBuf::from(&clean)
    } else {
        bin_dir.join(&clean)
    };
    if p.exists() {
        return Ok(p);
    }
    #[cfg(windows)]
    {
        if !clean.ends_with(".exe") {
            let with_exe = bin_dir.join(format!("{clean}.exe"));
            if with_exe.exists() {
                return Ok(with_exe);
            }
        }
    }
    Err(format!(
        "Node binary not found: {} (searched under {})",
        clean,
        bin_dir.display()
    ))
}

pub fn start_node(
    app: &AppHandle,
    network_id: String,
    environment: String,
    node_preset_id: &str,
    node_command_template: &str,
    bin_dir: &Path,
    data_dir: &Path,
) -> Result<(), String> {
    let preset_stored = sanitize_preset_id(node_preset_id);
    let key = process_key(&network_id, &environment, node_preset_id);
    {
        let nodes = ACTIVE_NODES.lock().map_err(|e| e.to_string())?;
        if nodes.contains_key(&key) {
            return Err("Node already running".into());
        }
    }

    let data_dir_str = data_dir.to_string_lossy();
    let node_dir_bin = bin_dir.to_string_lossy();
    let dd = quote_path_token(&data_dir_str);
    let nd = quote_path_token(&node_dir_bin);
    let cmd_str = node_command_template
        .replace("{dataDir}", &dd)
        .replace("{dataDirPath}", &dd)
        .replace("{data_dir}", &dd)
        .replace("{data_dir_path}", &dd)
        .replace("{nodeDir}", &nd)
        .trim()
        .to_string();
    let parts = split_command_args(&cmd_str);
    let exe = parts.first().ok_or("Empty command template")?;
    let args: Vec<String> = parts.iter().skip(1).cloned().collect();
    if let Some(port) = effective_rpc_port_for_preflight(&network_id, &args) {
        preflight_rpc_listen_port(port)?;
    }
    let exe_path = resolve_node_executable(bin_dir, exe)?;
    let cwd = exe_path.parent().ok_or("Invalid path")?;
    let mut cmd = Command::new(&exe_path);
    cmd.args(&args)
        .current_dir(cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        // If the node is a Rust binary, panics may otherwise omit a backtrace when stderr is a pipe.
        .env("RUST_BACKTRACE", "1");
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // Own process group so `stop_node` can kill the tree with `kill(-pid, SIGKILL)` (like Windows /T).
        unsafe {
            cmd.pre_exec(|| {
                if libc::setpgid(0, 0) != 0 {
                    return Err(std::io::Error::last_os_error());
                }
                Ok(())
            });
        }
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // No extra conhost window when spawning console binaries from the Tauri GUI.
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let mut child = cmd.spawn().map_err(|e| e.to_string())?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to pipe node stdout".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Failed to pipe node stderr".to_string())?;

    let ring_key = key.clone();
    clear_node_log_ring(&ring_key);
    emit_and_store_node_log_line(
        app,
        &ring_key,
        &network_id,
        &environment,
        &preset_stored,
        "meta",
        format!("$ {}", cmd_str),
    );
    forward_pipe_to_logs(
        app.clone(),
        ring_key.clone(),
        network_id.clone(),
        environment.clone(),
        preset_stored.clone(),
        "stdout",
        stdout,
    );
    forward_pipe_to_logs(
        app.clone(),
        ring_key,
        network_id.clone(),
        environment.clone(),
        preset_stored.clone(),
        "stderr",
        stderr,
    );

    let started_at = chrono::Utc::now().timestamp_millis() as u64;
    NODE_STATS
        .lock()
        .map_err(|e| e.to_string())?
        .insert(
            key.clone(),
            NodeStatus {
                started_at,
                status: "syncing".to_string(),
                is_active: true,
            },
        );
    ACTIVE_NODES
        .lock()
        .map_err(|e| e.to_string())?
        .insert(
            key,
            NodeEntry {
                app: app.clone(),
                _child: child,
                network_id,
                environment,
                node_preset_id: preset_stored,
            },
        );
    Ok(())
}

pub fn stop_node(
    user_data_dir: Option<&Path>,
    network_id: &str,
    environment: &str,
    node_preset_id: &str,
) {
    reap_exited_node_children();
    let key = process_key(network_id, environment, node_preset_id);
    let removed = if let Ok(mut nodes) = ACTIVE_NODES.lock() {
        nodes.remove(&key)
    } else {
        None
    };
    if let Some(mut entry) = removed {
        let pid = entry._child.id();
        #[cfg(windows)]
        {
            // Terminate the handle we hold (TerminateProcess), then taskkill /T for any detached children.
            let _ = entry._child.kill();
            use std::os::windows::process::CommandExt;
            if pid > 0 {
                let _ = Command::new("taskkill")
                    .args(["/F", "/T", "/PID", &pid.to_string()])
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .creation_flags(0x0800_0000)
                    .status();
            }
        }
        #[cfg(unix)]
        {
            if pid > 0 {
                if let Ok(p) = i32::try_from(pid) {
                    unsafe {
                        let _ = libc::kill(-p, libc::SIGKILL);
                    }
                }
            }
        }
        #[cfg(all(not(windows), not(unix)))]
        {
            let _ = entry._child.kill();
        }
        let _ = entry._child.wait();
    }
    mark_node_stats_inactive(&key);
    // Orphans: process still running but no Child in ACTIVE_NODES (e.g. session closed without stop, app restart).
    if let Some(root) = user_data_dir {
        let node_cache = root.join("nodes").join(node_dir_key(network_id, environment));
        kill_processes_executables_under(&node_cache);
    }
}

pub fn get_node_status(network_id: &str, environment: &str, node_preset_id: &str) -> Option<NodeStatus> {
    reap_exited_node_children();
    let key = process_key(network_id, environment, node_preset_id);
    NODE_STATS.lock().ok().and_then(|m| m.get(&key).cloned())
}

pub fn is_node_running(network_id: &str, environment: &str, node_preset_id: &str) -> bool {
    reap_exited_node_children();
    let key = process_key(network_id, environment, node_preset_id);
    ACTIVE_NODES
        .lock()
        .map(|m| m.contains_key(&key))
        .unwrap_or(false)
}

pub fn list_running_nodes() -> Vec<RunningNodeDescriptor> {
    reap_exited_node_children();
    let nodes = match ACTIVE_NODES.lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    let stats = match NODE_STATS.lock() {
        Ok(g) => g,
        Err(p) => p.into_inner(),
    };
    nodes
        .values()
        .map(|entry| {
            let key = process_key(
                &entry.network_id,
                &entry.environment,
                &entry.node_preset_id,
            );
            let started_at = stats.get(&key).map(|s| s.started_at).unwrap_or(0);
            RunningNodeDescriptor {
                network_id: entry.network_id.clone(),
                environment: entry.environment.clone(),
                node_preset_id: entry.node_preset_id.clone(),
                started_at,
            }
        })
        .collect()
}
