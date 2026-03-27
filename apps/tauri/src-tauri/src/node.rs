use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

#[derive(Clone, Debug, Serialize)]
pub struct NodeStatus {
    pub started_at: u64,
    pub status: String,
    pub is_active: bool,
}

#[allow(dead_code)]
struct NodeEntry {
    _child: Child,
    network_id: String,
    environment: String,
}

lazy_static::lazy_static! {
    static ref ACTIVE_NODES: Mutex<HashMap<String, NodeEntry>> = Mutex::new(HashMap::new());
    static ref NODE_STATS: Mutex<HashMap<String, NodeStatus>> = Mutex::new(HashMap::new());
}

fn node_dir_key(network_id: &str, environment: &str) -> String {
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
fn node_download_cache_key(url: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    let full: String = format!("{:x}", hasher.finalize());
    full.chars().take(16).collect()
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
        let actual = sha256_bytes(&bytes);
        if actual.to_lowercase() != expected.to_lowercase() {
            let _ = std::fs::remove_file(&archive_path);
            return Err("Integrity check failed: SHA256 mismatch".into());
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
    network_id: String,
    environment: String,
    node_preset_id: &str,
    node_command_template: &str,
    bin_dir: &Path,
    data_dir: &Path,
) -> Result<(), String> {
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
    let exe_path = resolve_node_executable(bin_dir, exe)?;
    let cwd = exe_path.parent().ok_or("Invalid path")?;
    let child = Command::new(&exe_path)
        .args(&args)
        .current_dir(cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

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
                _child: child,
                network_id,
                environment,
            },
        );
    Ok(())
}

pub fn stop_node(network_id: &str, environment: &str, node_preset_id: &str) {
    let key = process_key(network_id, environment, node_preset_id);
    if let Ok(mut nodes) = ACTIVE_NODES.lock() {
        if let Some(mut entry) = nodes.remove(&key) {
            let _ = entry._child.kill();
        }
    }
    if let Ok(mut stats) = NODE_STATS.lock() {
        if let Some(s) = stats.get_mut(&key) {
            s.is_active = false;
        }
    }
}

pub fn get_node_status(network_id: &str, environment: &str, node_preset_id: &str) -> Option<NodeStatus> {
    let key = process_key(network_id, environment, node_preset_id);
    NODE_STATS.lock().ok().and_then(|m| m.get(&key).cloned())
}

pub fn is_node_running(network_id: &str, environment: &str, node_preset_id: &str) -> bool {
    let key = process_key(network_id, environment, node_preset_id);
    ACTIVE_NODES
        .lock()
        .map(|m| m.contains_key(&key))
        .unwrap_or(false)
}
