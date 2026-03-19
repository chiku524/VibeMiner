#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mining;
mod node;
mod settings;

use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
struct UpdateInfo {
    latest_version: String,
    release_page_url: String,
    direct_download_url: String,
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
fn get_auto_update_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(settings::load(&path).auto_update)
}

#[tauri::command]
fn set_auto_update_enabled(app: tauri::AppHandle, enabled: bool) -> Result<bool, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut s = settings::load(&path);
    s.auto_update = enabled;
    settings::save(&path, &s)?;
    Ok(enabled)
}

#[tauri::command]
async fn reload(window: tauri::Window) -> Result<(), String> {
    window.eval("window.location.reload()").map_err(|e| e.to_string())
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    let allowed = ["https:", "http:"];
    let ok = allowed.iter().any(|p| url.starts_with(p));
    if !ok {
        return Err("Invalid URL scheme".into());
    }
    open::that(&url).map_err(|e| e.to_string())
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let current = app.package_info().version.to_string();
    let client = reqwest::Client::builder()
        .user_agent("VibeMiner/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .get("https://api.github.com/repos/chiku524/VibeMiner/releases/latest")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let tag = json
        .get("tag_name")
        .and_then(|t| t.as_str())
        .unwrap_or("")
        .trim_start_matches('v');
    let newer = tag
        .split('.')
        .zip(current.split('.'))
        .find(|(a, b)| a.parse::<u32>().unwrap_or(0) > b.parse::<u32>().unwrap_or(0))
        .is_some();
    let (os, ext) = if std::env::consts::OS == "windows" {
        ("win", "VibeMiner-Setup-latest.exe")
    } else if std::env::consts::OS == "macos" {
        ("macos", "VibeMiner-latest-arm64.dmg")
    } else {
        ("linux", "VibeMiner-latest.AppImage")
    };
    let base = "https://github.com/chiku524/VibeMiner/releases/latest/download";
    let direct = format!("{}/{}", base, ext);
    Ok(serde_json::json!({
        "updateAvailable": newer && !tag.is_empty(),
        "latestVersion": if tag.is_empty() { serde_json::Value::Null } else { serde_json::json!(tag) },
        "releasePageUrl": "https://github.com/chiku524/VibeMiner/releases/latest",
        "directDownloadUrl": direct,
        "error": false
    }))
}

#[tauri::command]
fn get_update_downloaded() -> bool {
    false
}

#[tauri::command]
fn get_update_available_info() -> Option<UpdateInfo> {
    None
}

#[tauri::command]
async fn quit_and_install() -> Result<(), String> {
    Err("Not implemented".into())
}

#[tauri::command]
async fn install_update_now() -> Result<serde_json::Value, String> {
    Err("Not implemented".into())
}
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartMiningOpts {
    network: MiningNetwork,
    wallet_address: String,
}
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct MiningNetwork {
    id: String,
    pool_url: String,
    pool_port: u16,
    algorithm: Option<String>,
    environment: Option<String>,
}

#[tauri::command]
async fn start_real_mining(
    window: tauri::Window,
    app: tauri::AppHandle,
    opts: StartMiningOpts,
) -> Result<serde_json::Value, String> {
    let user_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let n = &opts.network;
    let env = n.environment.as_deref().unwrap_or("mainnet");
    let key = format!("{}:{}", env, n.id);
    if mining::is_mining(&n.id, env) {
        return Ok(serde_json::json!({ "ok": false, "error": "Already mining this network" }));
    }
    let window_emit = window.clone();
    let miner_path = tauri::async_runtime::spawn_blocking(move || {
        mining::ensure_miner_ready(&user_data, |phase, percent, message| {
            let _ = window_emit.emit(
                "miner-download-progress",
                serde_json::json!({ "phase": phase, "percent": percent, "message": message }),
            );
        })
    })
    .await
    .map_err(|e| e.to_string())??;
    let pool_url = n.pool_url.clone();
    let pool_port = n.pool_port;
    let wallet = opts.wallet_address.clone();
    let algo = n.algorithm.clone();
    let net_id = n.id.clone();
    let env_s = env.to_string();
    mining::start_mining(
        net_id,
        env_s,
        pool_url,
        pool_port,
        wallet,
        algo,
        miner_path,
    )?;
    Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn stop_real_mining(network_id: String, environment: String) {
    mining::stop_mining(&network_id, &environment);
}

#[tauri::command]
fn get_real_mining_stats(network_id: String, environment: String) -> Option<serde_json::Value> {
    mining::get_stats(&network_id, &environment).map(|s| {
        serde_json::json!({
            "networkId": s.network_id,
            "environment": s.environment,
            "startedAt": s.started_at,
            "hashrate": s.hashrate,
            "shares": s.shares,
            "isActive": s.is_active
        })
    })
}

#[tauri::command]
fn is_real_mining(network_id: String, environment: String) -> bool {
    mining::is_mining(&network_id, &environment)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartNodeOpts {
    network: NodeNetwork,
}
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeNetwork {
    id: String,
    environment: Option<String>,
    node_download_url: Option<String>,
    node_command_template: Option<String>,
    node_binary_sha256: Option<String>,
}

#[tauri::command]
async fn start_node(
    window: tauri::Window,
    app: tauri::AppHandle,
    opts: StartNodeOpts,
) -> Result<serde_json::Value, String> {
    let user_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let n = &opts.network;
    let env = n.environment.as_deref().unwrap_or("mainnet");
    let url = n
        .node_download_url
        .as_deref()
        .unwrap_or("")
        .to_string();
    let sha = n.node_binary_sha256.as_deref();
    let template = n
        .node_command_template
        .as_deref()
        .unwrap_or("")
        .to_string();
    if url.is_empty() {
        return Ok(serde_json::json!({ "ok": false, "error": "No node download URL" }));
    }
    if template.is_empty() {
        return Ok(serde_json::json!({ "ok": false, "error": "No node command template" }));
    }
    let window_emit = window.clone();
    let (bin_dir, data_dir) = tauri::async_runtime::spawn_blocking({
        let id = n.id.clone();
        let env_s = env.to_string();
        move || {
            node::ensure_node_ready(
                &id,
                &env_s,
                &url,
                sha,
                &user_data,
                |phase, percent, message| {
                    let _ = window_emit.emit(
                        "node-download-progress",
                        serde_json::json!({ "phase": phase, "percent": percent, "message": message }),
                    );
                },
            )
        }
    })
    .await
    .map_err(|e| e.to_string())??;
    node::start_node(
        n.id.clone(),
        env.to_string(),
        &template,
        &bin_dir,
        &data_dir,
    )?;
    Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn stop_node(network_id: String, environment: String) {
    node::stop_node(&network_id, &environment);
}

#[tauri::command]
fn get_node_status(network_id: String, environment: String) -> Option<serde_json::Value> {
    node::get_node_status(&network_id, &environment).map(|s| {
        serde_json::json!({
            "startedAt": s.started_at,
            "status": s.status,
            "isActive": s.is_active
        })
    })
}

#[tauri::command]
fn is_node_running(network_id: String, environment: String) -> bool {
    node::is_node_running(&network_id, &environment)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_platform,
            get_auto_update_enabled,
            set_auto_update_enabled,
            reload,
            open_external,
            check_for_updates,
            get_update_downloaded,
            get_update_available_info,
            quit_and_install,
            install_update_now,
            start_real_mining,
            stop_real_mining,
            get_real_mining_stats,
            is_real_mining,
            start_node,
            stop_node,
            get_node_status,
            is_node_running,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
