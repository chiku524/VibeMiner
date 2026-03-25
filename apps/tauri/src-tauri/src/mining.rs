use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::io::BufRead;
use std::thread;

const XMRIG_RELEASE_URL: &str = "https://api.github.com/repos/xmrig/xmrig/releases/latest";

#[derive(Clone, Debug, Serialize)]
pub struct MinerStats {
    pub network_id: String,
    pub environment: String,
    pub started_at: u64,
    pub hashrate: f64,
    pub shares: u64,
    pub is_active: bool,
}

#[allow(dead_code)]
struct MinerEntry {
    child: Child,
    network_id: String,
    environment: String,
}

lazy_static::lazy_static! {
    static ref ACTIVE_MINERS: Mutex<HashMap<String, MinerEntry>> = Mutex::new(HashMap::new());
    static ref MINER_STATS: Mutex<HashMap<String, MinerStats>> = Mutex::new(HashMap::new());
}

fn network_key(network_id: &str, environment: &str) -> String {
    format!("{}:{}", environment, network_id)
}

fn asset_pattern_windows_arm64(name: &str) -> bool {
    name.to_lowercase().ends_with("windows-arm64.zip")
}
fn asset_pattern_windows_x64(name: &str) -> bool {
    name.to_lowercase().ends_with("windows-x64.zip")
}
fn asset_pattern_macos_arm64(name: &str) -> bool {
    name.to_lowercase().ends_with("macos-arm64.tar.gz")
}
fn asset_pattern_macos_x64(name: &str) -> bool {
    name.to_lowercase().ends_with("macos-x64.tar.gz")
}
fn asset_pattern_linux(name: &str) -> bool {
    name.to_lowercase().ends_with("linux-static-x64.tar.gz")
}

fn get_asset_name() -> Result<String, String> {
    let (os, arch) = (std::env::consts::OS, std::env::consts::ARCH);
    let client = reqwest::blocking::Client::builder()
        .user_agent("VibeMiner/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .get(XMRIG_RELEASE_URL)
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().map_err(|e| e.to_string())?;
    let assets = json
        .get("assets")
        .and_then(|a| a.as_array())
        .ok_or("No assets")?;
    let name = assets
        .iter()
        .find_map(|a| {
            let n = a.get("name")?.as_str()?;
            let match_ = (os == "windows" && arch == "arm64" && asset_pattern_windows_arm64(n))
                || (os == "windows" && asset_pattern_windows_x64(n))
                || (os == "macos" && arch == "aarch64" && asset_pattern_macos_arm64(n))
                || (os == "macos" && asset_pattern_macos_x64(n))
                || (os == "linux" && asset_pattern_linux(n));
            if match_ {
                Some(n.to_string())
            } else {
                None
            }
        })
        .ok_or_else(|| format!("No XMRig binary for {}/{}", os, arch))?;
    Ok(name)
}

#[derive(Deserialize)]
struct GitHubAsset {
    browser_download_url: String,
}

fn download_and_extract(
    user_data_path: &Path,
    on_progress: &mut dyn FnMut(&str, u32, &str),
) -> Result<std::path::PathBuf, String> {
    let miners_dir = user_data_path.join("miners").join("xmrig");
    let exe_name = if std::env::consts::OS == "windows" {
        "xmrig.exe"
    } else {
        "xmrig"
    };
    let miner_path = miners_dir.join(exe_name);
    if miner_path.exists() {
        return Ok(miner_path);
    }

    on_progress("fetching", 0, "Checking for miner…");

    let asset_name = get_asset_name()?;
    let client = reqwest::blocking::Client::builder()
        .user_agent("VibeMiner/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .get(XMRIG_RELEASE_URL)
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().map_err(|e| e.to_string())?;
    let assets: Vec<GitHubAsset> = serde_json::from_value(
        json.get("assets")
            .cloned()
            .ok_or("No assets")?,
    )
    .map_err(|e| e.to_string())?;
    let url = assets
        .iter()
        .find(|a| a.browser_download_url.contains(&asset_name))
        .map(|a| a.browser_download_url.as_str())
        .ok_or("Asset URL not found")?;

    on_progress("downloading", 5, "Downloading miner…");
    std::fs::create_dir_all(&miners_dir).map_err(|e| e.to_string())?;
    let archive_path = miners_dir.join(&asset_name);
    let body = client
        .get(url)
        .header("Accept", "application/octet-stream")
        .send()
        .map_err(|e| e.to_string())?
        .bytes()
        .map_err(|e| e.to_string())?;
    std::fs::write(&archive_path, &body).map_err(|e| e.to_string())?;
    on_progress("downloading", 55, "Download complete");

    on_progress("extracting", 60, "Extracting…");
    let extract_dir = miners_dir.join("extract");
    std::fs::create_dir_all(&extract_dir).map_err(|e| e.to_string())?;

    if asset_name.to_lowercase().ends_with(".zip") {
        let file = std::fs::File::open(&archive_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let outpath = extract_dir.join(file.name());
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
    } else {
        let file = std::fs::File::open(&archive_path).map_err(|e| e.to_string())?;
        let dec = flate2::read::GzDecoder::new(file);
        let mut archive = tar::Archive::new(dec);
        archive.unpack(&extract_dir).map_err(|e| e.to_string())?;
    }

    let _ = std::fs::remove_file(&archive_path);

    let subdir = std::fs::read_dir(&extract_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .find(|e| e.file_name().to_string_lossy().starts_with("xmrig-"));
    let src_dir = subdir
        .map(|e| e.path())
        .unwrap_or_else(|| extract_dir.clone());
    let bin_name = std::fs::read_dir(&src_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .find(|e| {
            let name = e.file_name();
            let n = name.to_string_lossy();
            n == "xmrig" || n == "xmrig.exe"
        });
    let bin_name = bin_name
        .map(|e| e.file_name().into_string().unwrap_or_else(|_| exe_name.to_string()))
        .unwrap_or_else(|| exe_name.to_string());
    let src = src_dir.join(&bin_name);
    if src.exists() {
        std::fs::copy(&src, &miner_path).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&miner_path).map_err(|e| e.to_string())?.permissions();
            perms.set_mode(0o755);
            std::fs::set_permissions(&miner_path, perms).map_err(|e| e.to_string())?;
        }
    }
    let _ = std::fs::remove_dir_all(&extract_dir);
    on_progress("ready", 100, "Miner ready");
    Ok(miner_path)
}

pub fn ensure_miner_ready(
    user_data_path: &Path,
    mut on_progress: impl FnMut(&str, u32, &str),
) -> Result<std::path::PathBuf, String> {
    download_and_extract(user_data_path, &mut on_progress)
}

fn build_xmrig_args(pool_url: &str, pool_port: u16, wallet: &str, algorithm: Option<&str>) -> Vec<String> {
    let algo = algorithm.unwrap_or("randomx").to_lowercase();
    let is_gr = algo.contains("ghostrider") || algo == "gr";
    let mut args = vec![
        "--url".into(),
        format!("{}:{}", pool_url, pool_port),
        "-u".into(),
        wallet.to_string(),
        "--donate-level".into(),
        "0".into(),
        "--no-color".into(),
        "-l".into(),
        "mining.log".into(),
    ];
    if is_gr {
        args.push("-a".into());
        args.push("ghostrider".into());
    }
    args
}

fn parse_xmrig_line(line: &str) -> Option<f64> {
    let re = Regex::new(r"speed\s+\d+\w+/\d+\w+/\d+\w+\s+([\d.]+)\s+H/s").ok()?;
    re.captures(line)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse().ok())
        .or_else(|| {
            let re2 = Regex::new(r"([\d.]+)\s+H/s").ok()?;
            re2.captures(line)
                .and_then(|c| c.get(1))
                .and_then(|m| m.as_str().parse().ok())
        })
}

pub fn start_mining(
    network_id: String,
    environment: String,
    pool_url: String,
    pool_port: u16,
    wallet_address: String,
    algorithm: Option<String>,
    miner_path: std::path::PathBuf,
) -> Result<(), String> {
    if wallet_address.trim().len() < 10 {
        return Err("Valid wallet address required".into());
    }
    let key = network_key(&network_id, &environment);
    {
        let miners = ACTIVE_MINERS.lock().map_err(|e| e.to_string())?;
        if miners.contains_key(&key) {
            return Err("Already mining this network".into());
        }
    }

    let cwd = miner_path.parent().ok_or("Invalid miner path")?;
    let args = build_xmrig_args(
        &pool_url,
        pool_port,
        wallet_address.trim(),
        algorithm.as_deref(),
    );
    let mut child = Command::new(&miner_path)
        .args(&args)
        .current_dir(cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let started_at = chrono::Utc::now().timestamp_millis() as u64;
    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stderr = child.stderr.take().ok_or("No stderr")?;
    MINER_STATS
        .lock()
        .map_err(|e| e.to_string())?
        .insert(
            key.clone(),
            MinerStats {
                network_id: network_id.clone(),
                environment: environment.clone(),
                started_at,
                hashrate: 0.0,
                shares: 0,
                is_active: true,
            },
        );
    ACTIVE_MINERS
        .lock()
        .map_err(|e| e.to_string())?
        .insert(
            key.clone(),
            MinerEntry {
                child,
                network_id: network_id.clone(),
                environment: environment.clone(),
            },
        );

    let net_id_out = network_id.clone();
    let env_out = environment.clone();
    let net_id_err = network_id;
    let env_err = environment;
    thread::spawn(move || {
        let reader = std::io::BufReader::new(stdout);
        for line in reader.lines().filter_map(|l| l.ok()) {
            crate::mining::update_stats_from_line(&net_id_out, &env_out, &line);
        }
    });
    thread::spawn(move || {
        let reader = std::io::BufReader::new(stderr);
        for line in reader.lines().filter_map(|l| l.ok()) {
            crate::mining::update_stats_from_line(&net_id_err, &env_err, &line);
        }
    });

    Ok(())
}

pub fn stop_mining(network_id: &str, environment: &str) {
    let key = network_key(network_id, environment);
    if let Ok(mut miners) = ACTIVE_MINERS.lock() {
        if let Some(mut entry) = miners.remove(&key) {
            let _ = entry.child.kill();
        }
    }
    if let Ok(mut stats) = MINER_STATS.lock() {
        if let Some(s) = stats.get_mut(&key) {
            s.is_active = false;
        }
    }
}

pub fn get_stats(network_id: &str, environment: &str) -> Option<MinerStats> {
    let key = network_key(network_id, environment);
    MINER_STATS.lock().ok().and_then(|m| m.get(&key).cloned())
}

pub fn is_mining(network_id: &str, environment: &str) -> bool {
    ACTIVE_MINERS
        .lock()
        .map(|m| m.contains_key(&network_key(network_id, environment)))
        .unwrap_or(false)
}

pub fn update_stats_from_line(network_id: &str, environment: &str, line: &str) {
    if let Some(hr) = parse_xmrig_line(line) {
        let key = network_key(network_id, environment);
        if let Ok(mut stats) = MINER_STATS.lock() {
            if let Some(s) = stats.get_mut(&key) {
                s.hashrate = hr;
            }
        }
    }
}
