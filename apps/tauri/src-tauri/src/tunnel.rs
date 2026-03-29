//! Optional Cloudflare Tunnel (`cloudflared`) child process — exposes local JSON-RPC (e.g. :8545)
//! at a public hostname. Requires user-installed `cloudflared` and `~/.cloudflared/config.yml`.

use serde::Serialize;
use std::collections::VecDeque;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

use crate::settings::Settings;

struct TunnelEntry {
    _child: Child,
}

lazy_static::lazy_static! {
    static ref ACTIVE_TUNNEL: Mutex<Option<TunnelEntry>> = Mutex::new(None);
    static ref TUNNEL_LOG: Mutex<VecDeque<TunnelLogLine>> = Mutex::new(VecDeque::new());
    /// True when this app started the tunnel via `try_start_cloudflare_tunnel_for_boing_node` (stop Boing node stops it).
    static ref TUNNEL_LINKED_TO_BOING_NODE: AtomicBool = AtomicBool::new(false);
}

const TUNNEL_LOG_MAX: usize = 400;
const TUNNEL_LINE_MAX: usize = 8192;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TunnelLogLine {
    pub stream: String,
    pub line: String,
}

fn truncate_line(s: &str) -> String {
    if s.len() <= TUNNEL_LINE_MAX {
        s.to_string()
    } else {
        format!("{}…", &s[..TUNNEL_LINE_MAX.saturating_sub(3)])
    }
}

fn push_log(stream: &str, line: String) {
    let entry = TunnelLogLine {
        stream: stream.to_string(),
        line: truncate_line(&line),
    };
    if let Ok(mut m) = TUNNEL_LOG.lock() {
        m.push_back(entry);
        while m.len() > TUNNEL_LOG_MAX {
            m.pop_front();
        }
    }
}

fn emit_tunnel_log(app: &AppHandle, stream: &str, line: String) {
    let t = truncate_line(&line);
    push_log(stream, t.clone());
    let payload = serde_json::json!({ "stream": stream, "line": t });
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.emit("cloudflared-output", &payload);
    } else {
        let _ = app.emit("cloudflared-output", payload);
    }
}

fn cloudflared_exe_name() -> &'static str {
    if cfg!(windows) {
        "cloudflared.exe"
    } else {
        "cloudflared"
    }
}

/// Boing repo layout: `<boing.network>/.cloudflared/cloudflared(.exe)` (see `scripts/start-cloudflare-tunnel.bat`).
fn cloudflared_in_boing_root(repo_root: &Path) -> PathBuf {
    repo_root
        .join(".cloudflared")
        .join(cloudflared_exe_name())
}

/// `BOING_NETWORK_ROOT` / `BOING_REPO` → `.cloudflared/cloudflared`.
fn cloudflared_from_env_boing_root() -> Option<PathBuf> {
    for key in ["BOING_NETWORK_ROOT", "BOING_REPO", "BOING_NETWORK_DIR"] {
        if let Ok(v) = std::env::var(key) {
            let t = v.trim();
            if t.is_empty() {
                continue;
            }
            let p = cloudflared_in_boing_root(Path::new(t));
            if p.is_file() {
                return Some(p);
            }
        }
    }
    None
}

/// Walk `current_dir` ancestors; at each level check `<parent>/boing.network/.cloudflared/cloudflared`.
/// Matches a typical layout: `.../vibe-code/vibeminer` next to `.../vibe-code/boing.network`.
fn cloudflared_from_adjacent_boing_repo() -> Option<PathBuf> {
    let mut dir = std::env::current_dir().ok()?;
    for _ in 0..12 {
        if let Some(parent) = dir.parent() {
            let candidate = cloudflared_in_boing_root(&parent.join("boing.network"));
            if candidate.is_file() {
                return Some(candidate);
            }
        }
        match dir.parent() {
            Some(p) => dir = p.to_path_buf(),
            None => break,
        }
    }
    None
}

fn default_cloudflared_config_path() -> Result<PathBuf, String> {
    if cfg!(windows) {
        let base = std::env::var("USERPROFILE").map_err(|_| "USERPROFILE is not set".to_string())?;
        Ok(Path::new(&base).join(".cloudflared").join("config.yml"))
    } else {
        let base = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
        Ok(Path::new(&base).join(".cloudflared").join("config.yml"))
    }
}

fn effective_config_path(settings: &Settings) -> Result<PathBuf, String> {
    if let Some(ref p) = settings.cloudflare_config_path {
        let t = p.trim();
        if !t.is_empty() {
            return Ok(PathBuf::from(t));
        }
    }
    default_cloudflared_config_path()
}

/// Resolve `cloudflared` executable: settings override, then PATH, then common Windows installs.
pub fn resolve_cloudflared_exe(settings: &Settings) -> Result<PathBuf, String> {
    if let Some(ref p) = settings.cloudflared_path {
        let t = p.trim();
        if !t.is_empty() {
            let pb = PathBuf::from(t);
            if pb.exists() {
                return Ok(pb);
            }
            return Err(format!(
                "Configured cloudflared path does not exist: {}",
                pb.display()
            ));
        }
    }

    let candidates: &[&str] = if cfg!(windows) {
        &["cloudflared.exe", "cloudflared"]
    } else {
        &["cloudflared"]
    };

    if let Some(p) = cloudflared_from_env_boing_root() {
        return Ok(p);
    }
    if let Some(p) = cloudflared_from_adjacent_boing_repo() {
        return Ok(p);
    }

    for name in candidates {
        if Command::new(name)
            .arg("version")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
        {
            return Ok(PathBuf::from(*name));
        }
    }

    #[cfg(windows)]
    {
        for guess in [
            r"C:\Program Files\cloudflared\cloudflared.exe",
            r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
        ] {
            let pb = PathBuf::from(guess);
            if pb.exists() {
                return Ok(pb);
            }
        }
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            let pb = Path::new(&local)
                .join("Programs")
                .join("cloudflared")
                .join("cloudflared.exe");
            if pb.exists() {
                return Ok(pb);
            }
        }
    }

    Err(
        "cloudflared not found. Boing layout: place cloudflared under boing.network/.cloudflared/ or set BOING_NETWORK_ROOT. \
         Otherwise install from Cloudflare (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) \
         or set the full path under Desktop → Public RPC tunnel settings."
            .into(),
    )
}

fn tunnel_name(settings: &Settings) -> String {
    settings
        .cloudflare_tunnel_name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("boing-testnet-rpc")
        .to_string()
}

fn mark_inactive() {
    let _ = ACTIVE_TUNNEL.lock().map(|mut g| *g = None);
}

fn reap_exited_tunnel() {
    let Ok(mut guard) = ACTIVE_TUNNEL.lock() else {
        return;
    };
    if let Some(entry) = guard.as_mut() {
        match entry._child.try_wait() {
            Ok(Some(_)) => {
                *guard = None;
            }
            Ok(None) => {}
            Err(_) => {
                *guard = None;
            }
        }
    }
}

fn forward_tunnel_pipe<R: Read + Send + 'static>(
    app: AppHandle,
    stream: &'static str,
    reader: R,
) {
    std::thread::spawn(move || {
        let mut carry = String::new();
        let mut buf = [0u8; 4096];
        let mut r = reader;
        loop {
            match r.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    carry.push_str(&String::from_utf8_lossy(&buf[..n]));
                    while let Some(pos) = carry.find('\n') {
                        let mut line = carry[..pos].to_string();
                        carry.drain(..=pos);
                        if line.ends_with('\r') {
                            line.pop();
                        }
                        emit_tunnel_log(&app, stream, line);
                    }
                }
                Err(_) => break,
            }
        }
        let tail = carry.trim_end_matches(['\r', '\n']).to_string();
        if !tail.is_empty() {
            emit_tunnel_log(&app, stream, tail);
        }
    });
}

/// Spawn `cloudflared`; caller must hold no lock and slot must be empty.
fn start_cloudflare_tunnel_impl(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let exe = resolve_cloudflared_exe(settings)?;
    let config_path = effective_config_path(settings)?;
    if !config_path.is_file() {
        return Err(format!(
            "Tunnel config not found: {}. Log in with `cloudflared tunnel login` and create a tunnel, or adjust the config path in settings.",
            config_path.display()
        ));
    }

    let name = tunnel_name(settings);
    let cfg_str = config_path.to_string_lossy().to_string();

    let mut cmd = Command::new(&exe);
    cmd.args(["tunnel", "--config", &cfg_str, "run", &name])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start cloudflared: {e}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "cloudflared: no stdout pipe".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "cloudflared: no stderr pipe".to_string())?;

    if let Ok(mut log) = TUNNEL_LOG.lock() {
        log.clear();
    }
    let cmd_line = format!(
        "{} tunnel --config {} run {}",
        exe.to_string_lossy(),
        cfg_str,
        name
    );
    emit_tunnel_log(app, "meta", format!("$ {cmd_line}"));

    forward_tunnel_pipe(app.clone(), "stdout", stdout);
    forward_tunnel_pipe(app.clone(), "stderr", stderr);

    {
        let mut guard = ACTIVE_TUNNEL.lock().map_err(|e| e.to_string())?;
        *guard = Some(TunnelEntry { _child: child });
    }

    Ok(())
}

/// User-started tunnel: not tied to Boing node lifecycle.
pub fn start_cloudflare_tunnel(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    reap_exited_tunnel();
    {
        let guard = ACTIVE_TUNNEL.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Err("Cloudflare tunnel is already running".into());
        }
    }
    TUNNEL_LINKED_TO_BOING_NODE.store(false, Ordering::SeqCst);
    start_cloudflare_tunnel_impl(app, settings)
}

/// After Boing node starts: start tunnel if idle; mark linked so `stop_node` can stop it.
pub fn try_start_cloudflare_tunnel_for_boing_node(app: &AppHandle, settings: &Settings) {
    reap_exited_tunnel();
    {
        let Ok(guard) = ACTIVE_TUNNEL.lock() else {
            return;
        };
        if guard.is_some() {
            emit_tunnel_log(
                app,
                "meta",
                "Tunnel already running; leaving it unchanged (not linked to this node).".to_string(),
            );
            return;
        }
    }
    match start_cloudflare_tunnel_impl(app, settings) {
        Ok(()) => {
            TUNNEL_LINKED_TO_BOING_NODE.store(true, Ordering::SeqCst);
            emit_tunnel_log(
                app,
                "meta",
                "Cloudflare tunnel started automatically with Boing node (disable in Public RPC tunnel settings if undesired)."
                    .to_string(),
            );
        }
        Err(e) => emit_tunnel_log(
            app,
            "meta",
            format!("Auto tunnel skipped: {e}"),
        ),
    }
}

fn wait_child_exit_gracefully(child: &mut Child, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    loop {
        match child.try_wait() {
            Ok(Some(_)) => return true,
            Ok(None) => {}
            Err(_) => return false,
        }
        if Instant::now() >= deadline {
            return false;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
}

#[cfg(windows)]
fn stop_tunnel_process_windows(child: &mut Child) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let pid = child.id();

    let _ = Command::new("taskkill")
        .args(["/PID", &pid.to_string()])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .status();

    if !wait_child_exit_gracefully(child, Duration::from_secs(6)) {
        let _ = Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        let _ = wait_child_exit_gracefully(child, Duration::from_secs(3));
    }
}

#[cfg(unix)]
fn stop_tunnel_process_unix(child: &mut Child) {
    let pid = child.id() as libc::pid_t;
    if pid > 0 {
        unsafe {
            libc::kill(pid, libc::SIGTERM);
        }
    }
    if !wait_child_exit_gracefully(child, Duration::from_secs(6)) {
        if pid > 0 {
            unsafe {
                let _ = libc::kill(pid, libc::SIGKILL);
            }
        }
        let _ = child.kill();
        let _ = wait_child_exit_gracefully(child, Duration::from_secs(2));
    }
}

fn stop_cloudflare_tunnel_inner() {
    reap_exited_tunnel();
    let removed = if let Ok(mut guard) = ACTIVE_TUNNEL.lock() {
        guard.take()
    } else {
        None
    };

    if let Some(mut entry) = removed {
        #[cfg(windows)]
        stop_tunnel_process_windows(&mut entry._child);
        #[cfg(unix)]
        stop_tunnel_process_unix(&mut entry._child);
        let _ = entry._child.wait();
    }
    mark_inactive();
}

pub fn stop_cloudflare_tunnel() {
    TUNNEL_LINKED_TO_BOING_NODE.store(false, Ordering::SeqCst);
    stop_cloudflare_tunnel_inner();
}

/// Stop tunnel only if we auto-started it with a Boing node (does not stop a user-started tunnel).
pub fn stop_cloudflare_tunnel_if_linked_to_boing_node() {
    if TUNNEL_LINKED_TO_BOING_NODE.swap(false, Ordering::SeqCst) {
        stop_cloudflare_tunnel_inner();
    }
}

pub fn is_cloudflare_tunnel_running() -> bool {
    reap_exited_tunnel();
    ACTIVE_TUNNEL
        .lock()
        .map(|g| g.is_some())
        .unwrap_or(false)
}

pub fn get_cloudflare_tunnel_log_snapshot() -> Vec<TunnelLogLine> {
    TUNNEL_LOG
        .lock()
        .map(|m| m.iter().cloned().collect())
        .unwrap_or_default()
}

/// JSON for settings UI: stored fields + resolved config path.
pub fn settings_snapshot_json(settings: &Settings) -> serde_json::Value {
    let eff_cfg = effective_config_path(settings)
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|e| format!("(error: {e})"));
    let resolved_exe = resolve_cloudflared_exe(settings)
        .ok()
        .map(|p| p.to_string_lossy().into_owned());
    serde_json::json!({
        "cloudflaredPath": settings.cloudflared_path.clone(),
        "cloudflareTunnelName": tunnel_name(settings),
        "cloudflareConfigPath": settings.cloudflare_config_path.clone(),
        "linkTunnelWithBoingNode": settings.link_tunnel_with_boing_node,
        "effectiveConfigPath": eff_cfg,
        "resolvedCloudflaredPath": resolved_exe,
    })
}
