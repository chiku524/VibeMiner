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

fn network_key(network_id: &str, environment: &str) -> String {
    format!("{}:{}", environment, network_id)
}

fn sha256_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

pub fn ensure_node_ready(
    network_id: &str,
    environment: &str,
    node_download_url: &str,
    node_binary_sha256: Option<&str>,
    user_data_path: &Path,
    mut on_progress: impl FnMut(&str, u32, &str),
) -> Result<(std::path::PathBuf, std::path::PathBuf), String> {
    let key = network_key(network_id, environment);
    let node_dir = user_data_path.join("nodes").join(&key);
    let data_dir = node_dir.join("data");
    let ready_marker = node_dir.join("ready");
    if ready_marker.exists() {
        return Ok((node_dir.join("bin"), data_dir));
    }

    if node_download_url.is_empty() {
        return Err("No node download URL".into());
    }

    on_progress("fetching", 0, "Downloading node…");
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    let archive_path = node_dir.join("archive");
    let extract_path = node_dir.join("extract");
    std::fs::create_dir_all(&node_dir).map_err(|e| e.to_string())?;

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
    let bin_dir = node_dir.join("bin");
    if bin_dir.exists() {
        std::fs::remove_dir_all(&bin_dir).map_err(|e| e.to_string())?;
    }
    std::fs::rename(&src_dir, &bin_dir).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_dir_all(&extract_path);
    std::fs::write(&ready_marker, "").map_err(|e| e.to_string())?;
    on_progress("ready", 100, "Node ready");
    Ok((bin_dir, data_dir))
}

pub fn start_node(
    network_id: String,
    environment: String,
    node_command_template: &str,
    bin_dir: &Path,
    data_dir: &Path,
) -> Result<(), String> {
    let key = network_key(&network_id, &environment);
    {
        let nodes = ACTIVE_NODES.lock().map_err(|e| e.to_string())?;
        if nodes.contains_key(&key) {
            return Err("Node already running".into());
        }
    }

    let data_dir_str = data_dir.to_string_lossy();
    let node_dir_bin = bin_dir.to_string_lossy();
    let cmd_str = node_command_template
        .replace("{dataDir}", &data_dir_str)
        .replace("{dataDirPath}", &data_dir_str)
        .replace("{data_dir}", &data_dir_str)
        .replace("{data_dir_path}", &data_dir_str)
        .replace("{nodeDir}", &node_dir_bin)
        .trim()
        .to_string();
    let parts: Vec<&str> = cmd_str.split_whitespace().collect();
    let exe = parts.get(0).ok_or("Empty command template")?;
    let args: Vec<String> = parts.iter().skip(1).map(|s| (*s).to_string()).collect();
    let exe_path = if Path::new(exe).is_absolute() {
        Path::new(exe).to_path_buf()
    } else {
        bin_dir.join(exe)
    };
    if !exe_path.exists() {
        return Err(format!("Node binary not found: {}", exe_path.display()));
    }
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

pub fn stop_node(network_id: &str, environment: &str) {
    let key = network_key(network_id, environment);
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

pub fn get_node_status(network_id: &str, environment: &str) -> Option<NodeStatus> {
    let key = network_key(network_id, environment);
    NODE_STATS.lock().ok().and_then(|m| m.get(&key).cloned())
}

pub fn is_node_running(network_id: &str, environment: &str) -> bool {
    ACTIVE_NODES
        .lock()
        .map(|m| m.contains_key(&network_key(network_id, environment)))
        .unwrap_or(false)
}
