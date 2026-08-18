#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod boing_validator;
mod mining;
mod node;
mod settings;
mod tunnel;
mod vaultl1;

use serde::Serialize;
use serde_json::json;
use std::path::PathBuf;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, RunEvent, WindowEvent};
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize)]
struct UpdateInfo {
    latest_version: String,
    release_page_url: String,
    direct_download_url: String,
}

fn load_tray_icon() -> tauri::image::Image<'static> {
    #[cfg(windows)]
    {
        tauri::image::Image::from_bytes(include_bytes!("../icons/icon.ico"))
            .expect("icons/icon.ico must decode for system tray")
    }
    #[cfg(target_os = "macos")]
    {
        tauri::image::Image::from_bytes(include_bytes!("../icons/128x128.png"))
            .expect("icons/128x128.png must decode for system tray")
    }
    #[cfg(all(not(windows), not(target_os = "macos")))]
    {
        tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))
            .expect("icons/32x32.png must decode for system tray")
    }
}

fn show_and_focus_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let icon = load_tray_icon();
    let show_i = MenuItem::with_id(app, "show", "Show VibeMiner", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &sep, &quit_i])?;

    let _ = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .tooltip("VibeMiner")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_and_focus_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_and_focus_main(tray.app_handle());
            }
        })
        .build(app);

    Ok(())
}

fn attach_window_close_handlers(app: &tauri::App) -> tauri::Result<()> {
    if let Some(main) = app.get_webview_window("main") {
        let handle = app.handle().clone();
        main.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Some(w) = handle.get_webview_window("main") {
                    let _ = w.hide();
                }
            }
        });
    }

    if let Some(splash) = app.get_webview_window("splashscreen") {
        let handle = app.handle().clone();
        splash.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = handle.exit(0);
            }
        });
    }

    Ok(())
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
    let wv = window
        .webviews()
        .into_iter()
        .next()
        .ok_or_else(|| "No webview".to_string())?;
    wv.eval("window.location.reload()").map_err(|e| e.to_string())
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
    match app.updater().map_err(|e| e.to_string())?.check().await {
        Ok(Some(update)) => Ok(json!({
            "updateAvailable": true,
            "latestVersion": update.version,
            "releasePageUrl": "https://github.com/chiku524/VibeMiner/releases/latest",
            "directDownloadUrl": update.download_url.to_string(),
            "error": false
        })),
        Ok(None) => Ok(json!({
            "updateAvailable": false,
            "latestVersion": serde_json::Value::Null,
            "releasePageUrl": "https://github.com/chiku524/VibeMiner/releases/latest",
            "directDownloadUrl": serde_json::Value::Null,
            "error": false
        })),
        Err(e) => Ok(json!({
            "updateAvailable": false,
            "error": true,
            "message": e.to_string()
        })),
    }
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
fn quit_and_install(app: tauri::AppHandle) -> Result<(), String> {
    app.request_restart();
    Ok(())
}

#[tauri::command]
async fn install_update_now(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let Some(update) = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?
    else {
        return Ok(json!({ "ok": false, "error": "No update available" }));
    };

    let emit = app.clone();
    update
        .download_and_install(
            move |chunk_len, content_len| {
                let _ = emit.emit(
                    "desktop-update-progress",
                    json!({
                        "phase": "downloading",
                        "chunkLen": chunk_len,
                        "contentLen": content_len
                    }),
                );
            },
            {
                let fin = app.clone();
                move || {
                    let _ = fin.emit(
                        "desktop-update-progress",
                        json!({ "phase": "installing" }),
                    );
                }
            },
        )
        .await
        .map_err(|e| e.to_string())?;

    app.request_restart();
    Ok(json!({ "ok": true }))
}

#[tauri::command]
async fn close_splash_and_show_main(app: tauri::AppHandle) -> Result<(), String> {
    let splash = app
        .get_webview_window("splashscreen")
        .ok_or_else(|| "splash window not found".to_string())?;
    let main_win = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    splash.destroy().map_err(|e| e.to_string())?;
    main_win.show().map_err(|e| e.to_string())?;
    main_win.set_focus().map_err(|e| e.to_string())?;
    Ok(())
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

// Tauri 2 maps invoke JSON to Rust args by name; the webview must send `{ opts: StartMiningOpts }` (see `apps/web/public/desktop-bridge.js`).
#[tauri::command]
async fn start_real_mining(
    window: tauri::Window,
    app: tauri::AppHandle,
    opts: StartMiningOpts,
) -> Result<serde_json::Value, String> {
    let user_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let n = &opts.network;
    let env = n.environment.as_deref().unwrap_or("mainnet");
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
    node_preset_id: Option<String>,
    /// VaultL1: peer LAN IP (other machine) for `{peerHost}` templates.
    vault_peer_host: Option<String>,
    /// VaultL1 PC A: remote validator address (from PC B identity).
    vault_peer_address: Option<String>,
    /// VaultL1 PC A: remote validator pubkey hex.
    vault_peer_pubkey: Option<String>,
    /// VaultL1 PC B: absolute path to shared genesis JSON.
    vault_genesis_path: Option<String>,
    /// VaultL1 PC B: raw genesis JSON paste (optional alternative to path).
    vault_genesis_json: Option<String>,
}

// Same `opts` wrapper as `start_real_mining` — required for `invoke('start_node', { opts: { network: … } })`.
#[tauri::command]
async fn start_node(
    window: tauri::Window,
    app: tauri::AppHandle,
    opts: StartNodeOpts,
) -> Result<serde_json::Value, String> {
    let user_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let StartNodeOpts { network: n } = opts;
    let env = n
        .environment
        .as_deref()
        .unwrap_or("mainnet")
        .to_string();
    let url = n
        .node_download_url
        .as_deref()
        .unwrap_or("")
        .to_string();
    let sha = n.node_binary_sha256.clone();
    let template = n
        .node_command_template
        .as_deref()
        .unwrap_or("")
        .to_string();
    let network_id = n.id.clone();
    let preset_raw = n
        .node_preset_id
        .clone()
        .unwrap_or_else(|| "default".to_string());
    let local_boing_exe = node::boing_local_exe_from_env(&network_id)?;
    // Optional override only (like Boing). Otherwise download zip from preset URL.
    let local_vault_exe = vaultl1::vault_local_exe_from_env(&network_id)?;
    if local_boing_exe.is_none() && local_vault_exe.is_none() && url.is_empty() {
        return Ok(serde_json::json!({ "ok": false, "error": "No node download URL" }));
    }
    if template.is_empty() {
        return Ok(serde_json::json!({ "ok": false, "error": "No node command template" }));
    }
    let vault_opts = vaultl1::VaultJoinOpts {
        peer_host: n.vault_peer_host.clone(),
        peer_address: n.vault_peer_address.clone(),
        peer_pubkey: n.vault_peer_pubkey.clone(),
        genesis_path: n.vault_genesis_path.clone(),
        genesis_json: n.vault_genesis_json.clone(),
    };
    let window_emit = window.clone();
    let user_data_path = user_data.clone();
    let id_for_ready = network_id.clone();
    let env_for_ready = env.clone();
    let url_for_ready = url.clone();
    let preset_for_ready = preset_raw.clone();
    let sha_for_ready = sha.clone();
    let local_for_blocking = local_boing_exe
        .clone()
        .or_else(|| local_vault_exe.clone());
    let (bin_dir, data_dir) = if let Some(ref exe_path) = local_for_blocking {
        tauri::async_runtime::spawn_blocking({
            let exe_path = exe_path.clone();
            let id_for_ready = id_for_ready.clone();
            let env_for_ready = env_for_ready.clone();
            let preset_for_ready = preset_for_ready.clone();
            let user_data_path = user_data_path.clone();
            move || {
                node::ensure_local_boing_node_paths(
                    &id_for_ready,
                    &env_for_ready,
                    &preset_for_ready,
                    &user_data_path,
                    &exe_path,
                )
            }
        })
        .await
        .map_err(|e| e.to_string())??
    } else {
        tauri::async_runtime::spawn_blocking(move || {
            node::ensure_node_ready(
                &id_for_ready,
                &env_for_ready,
                &preset_for_ready,
                &url_for_ready,
                sha_for_ready.as_deref(),
                &user_data_path,
                |phase, percent, message| {
                    let _ = window_emit.emit(
                        "node-download-progress",
                        serde_json::json!({ "phase": phase, "percent": percent, "message": message }),
                    );
                },
            )
        })
        .await
        .map_err(|e| e.to_string())??
    };
    let mut template_run = if let Some(ref exe_path) = local_for_blocking {
        node::replace_command_template_exe(&template, exe_path)?
    } else {
        template.clone()
    };
    let mut vault_prepare: Option<serde_json::Value> = None;
    if vaultl1::is_vaultl1_network_id(&network_id) {
        let vaultd = match vaultl1::resolve_vaultd_for_start(
            local_vault_exe.as_deref(),
            &bin_dir,
            &template_run,
        ) {
            Ok(p) => p,
            Err(e) => return Ok(serde_json::json!({ "ok": false, "error": e })),
        };
        template_run =
            match vaultl1::apply_peer_host_template(&template_run, &vault_opts, &preset_raw) {
                Ok(t) => t,
                Err(e) => return Ok(serde_json::json!({ "ok": false, "error": e })),
            };
        let prepared = match tauri::async_runtime::spawn_blocking({
            let vaultd = vaultd.clone();
            let home = data_dir.clone();
            let preset = preset_raw.clone();
            let vault_opts = vault_opts.clone();
            move || vaultl1::prepare_vaultl1_home(&vaultd, &home, &preset, &vault_opts)
        })
        .await
        .map_err(|e| e.to_string())?
        {
            Ok(info) => info,
            Err(e) => return Ok(serde_json::json!({ "ok": false, "error": e })),
        };
        vault_prepare = serde_json::to_value(&prepared).ok();
        template_run = node::replace_command_template_exe(&template_run, &vaultd)?;
    }
    let stake_identity = node::start_node(
        &app,
        network_id.clone(),
        env.clone(),
        &preset_raw,
        &template_run,
        &bin_dir,
        &data_dir,
        &user_data,
    )?;
    if let Ok(path) = app.path().app_data_dir() {
        let s = settings::load(&path);
        if s.link_tunnel_with_boing_node && network_id.to_lowercase().contains("boing") {
            tunnel::try_start_cloudflare_tunnel_for_boing_node(&app, &s);
        }
    }

    // One-click public stake join: faucet + Bond on public testnet RPC after spawn.
    let mut join_result: Option<serde_json::Value> = None;
    if boing_validator::is_public_stake_validator_preset(&preset_raw) {
        let ud = user_data.clone();
        let nid = network_id.clone();
        let envj = env.clone();
        let preset = preset_raw.clone();
        match tauri::async_runtime::spawn_blocking(move || {
            // Few attempts: current faucet dispenses 50k (≥ min stake + fees). Retry via join_boing_stake_validator.
            boing_validator::join_stake_validator(
                &ud,
                &nid,
                &envj,
                &preset,
                None,
                None,
                4,
            )
        })
        .await
        {
            Ok(Ok(r)) => {
                join_result = Some(serde_json::to_value(&r).unwrap_or(serde_json::json!({
                    "ok": r.ok,
                    "message": r.message,
                    "accountIdHex": r.account_id_hex,
                    "bonded": r.bonded,
                })));
            }
            Ok(Err(e)) => {
                join_result = Some(serde_json::json!({
                    "ok": false,
                    "message": e,
                    "accountIdHex": stake_identity.as_ref().map(|i| i.account_id_hex.clone()),
                    "bonded": false,
                }));
            }
            Err(e) => {
                join_result = Some(serde_json::json!({
                    "ok": false,
                    "message": format!("join stake task failed: {e}"),
                    "bonded": false,
                }));
            }
        }
    }

    Ok(serde_json::json!({
        "ok": true,
        "validatorIdentity": stake_identity,
        "stakeJoin": join_result,
        "vaultPrepare": vault_prepare,
    }))
}

#[tauri::command]
fn get_boing_validator_identity(
    app: tauri::AppHandle,
    network_id: String,
    environment: String,
    node_preset_id: Option<String>,
) -> Result<Option<boing_validator::BoingValidatorIdentity>, String> {
    let pid = node_preset_id.as_deref().unwrap_or("default");
    if !boing_validator::is_public_stake_validator_preset(pid) {
        return Ok(None);
    }
    let user_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(Some(boing_validator::ensure_validator_key(
        &user_data,
        &network_id,
        &environment,
        pid,
    )?))
}

#[tauri::command]
async fn join_boing_stake_validator(
    app: tauri::AppHandle,
    network_id: String,
    environment: String,
    node_preset_id: Option<String>,
    rpc_url: Option<String>,
    use_local_rpc: Option<bool>,
    node_command_template: Option<String>,
) -> Result<boing_validator::JoinStakeValidatorResult, String> {
    let pid = node_preset_id.unwrap_or_else(|| "default".to_string());
    let user_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let local_port = if use_local_rpc.unwrap_or(false) {
        Some(node::rpc_port_from_command_template(
            &network_id,
            node_command_template.as_deref().unwrap_or(""),
        ))
    } else {
        None
    };
    let rpc_override = rpc_url.filter(|s| !s.trim().is_empty());
    tauri::async_runtime::spawn_blocking(move || {
        boing_validator::join_stake_validator(
            &user_data,
            &network_id,
            &environment,
            &pid,
            rpc_override.as_deref(),
            local_port,
            40,
        )
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeTargetOpts {
    network_id: String,
    environment: String,
    #[serde(default)]
    node_preset_id: Option<String>,
}

fn resolve_node_target(
    opts: Option<NodeTargetOpts>,
    network_id: Option<String>,
    environment: Option<String>,
    node_preset_id: Option<String>,
) -> Result<(String, String, String), String> {
    let (nid, env, preset_opt) = if let Some(o) = opts {
        (o.network_id, o.environment, o.node_preset_id)
    } else {
        (
            network_id.unwrap_or_default(),
            environment.unwrap_or_default(),
            node_preset_id,
        )
    };
    if nid.trim().is_empty() {
        return Err("networkId is required".into());
    }
    let env = if env.trim().is_empty() {
        "mainnet".to_string()
    } else {
        env
    };
    let preset = preset_opt
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "default".to_string());
    Ok((nid, env, preset))
}

/// Same `opts` wrapper as `start_node` so the remote webview actually reaches this command.
/// Flat camelCase / snake_case args are still accepted for older desktop-bridge.js.
#[tauri::command]
async fn stop_node(
    app: tauri::AppHandle,
    opts: Option<NodeTargetOpts>,
    network_id: Option<String>,
    environment: Option<String>,
    node_preset_id: Option<String>,
) -> Result<serde_json::Value, String> {
    let (network_id, environment, preset) =
        resolve_node_target(opts, network_id, environment, node_preset_id)?;
    let user_data = app.path().app_data_dir().ok();
    let nid = network_id.clone();
    let env = environment.clone();
    let pid = preset.clone();
    let ud = user_data.clone();
    let still_running = tauri::async_runtime::spawn_blocking(move || {
        node::stop_node(ud.as_deref(), &nid, &env, &pid);
        node::is_node_running(&nid, &env, &pid)
    })
    .await
    .map_err(|e| e.to_string())?;
    if let Some(ref path) = user_data {
        let s = settings::load(path);
        if s.link_tunnel_with_boing_node && network_id.to_lowercase().contains("boing") {
            tunnel::stop_cloudflare_tunnel_if_linked_to_boing_node();
        }
    }
    if still_running {
        return Ok(serde_json::json!({
            "ok": false,
            "error": "Node process is still running"
        }));
    }
    Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn get_node_status(
    opts: Option<NodeTargetOpts>,
    network_id: Option<String>,
    environment: Option<String>,
    node_preset_id: Option<String>,
) -> Result<Option<serde_json::Value>, String> {
    let (network_id, environment, pid) =
        resolve_node_target(opts, network_id, environment, node_preset_id)?;
    Ok(node::get_node_status(&network_id, &environment, &pid).map(|s| {
        serde_json::json!({
            "startedAt": s.started_at,
            "status": s.status,
            "isActive": s.is_active,
            "chainHeight": s.chain_height,
            "rpcPort": s.rpc_port,
        })
    }))
}

#[tauri::command]
fn is_node_running(
    opts: Option<NodeTargetOpts>,
    network_id: Option<String>,
    environment: Option<String>,
    node_preset_id: Option<String>,
) -> Result<bool, String> {
    let (network_id, environment, pid) =
        resolve_node_target(opts, network_id, environment, node_preset_id)?;
    Ok(node::is_node_running(&network_id, &environment, &pid))
}

#[tauri::command]
fn list_running_nodes() -> Vec<node::RunningNodeDescriptor> {
    node::list_running_nodes()
}

#[tauri::command]
fn get_node_log_snapshot(
    opts: Option<NodeTargetOpts>,
    network_id: Option<String>,
    environment: Option<String>,
    node_preset_id: Option<String>,
) -> Result<Vec<node::NodeLogLineEntry>, String> {
    let (network_id, environment, pid) =
        resolve_node_target(opts, network_id, environment, node_preset_id)?;
    Ok(node::get_node_log_snapshot(&network_id, &environment, &pid))
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct TunnelSettingsPatch {
    cloudflared_path: Option<String>,
    cloudflare_tunnel_name: Option<String>,
    cloudflare_config_path: Option<String>,
    link_tunnel_with_boing_node: Option<bool>,
}

#[tauri::command]
fn get_tunnel_settings(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let s = settings::load(&path);
    Ok(tunnel::settings_snapshot_json(&s))
}

#[tauri::command]
fn set_tunnel_settings(app: tauri::AppHandle, patch: TunnelSettingsPatch) -> Result<(), String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut s = settings::load(&path);
    if let Some(v) = patch.cloudflared_path {
        let t = v.trim();
        s.cloudflared_path = if t.is_empty() { None } else { Some(t.to_string()) };
    }
    if let Some(v) = patch.cloudflare_tunnel_name {
        let t = v.trim();
        s.cloudflare_tunnel_name = if t.is_empty() { None } else { Some(t.to_string()) };
    }
    if let Some(v) = patch.cloudflare_config_path {
        let t = v.trim();
        s.cloudflare_config_path = if t.is_empty() { None } else { Some(t.to_string()) };
    }
    if let Some(v) = patch.link_tunnel_with_boing_node {
        s.link_tunnel_with_boing_node = v;
    }
    settings::save(&path, &s)
}

#[tauri::command]
fn start_cloudflare_tunnel(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let s = settings::load(&path);
    tunnel::start_cloudflare_tunnel(&app, &s)?;
    Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn stop_cloudflare_tunnel() {
    tunnel::stop_cloudflare_tunnel();
}

#[tauri::command]
fn is_cloudflare_tunnel_running() -> bool {
    tunnel::is_cloudflare_tunnel_running()
}

#[tauri::command]
fn get_cloudflare_tunnel_log_snapshot() -> Vec<tunnel::TunnelLogLine> {
    tunnel::get_cloudflare_tunnel_log_snapshot()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
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
            close_splash_and_show_main,
            start_real_mining,
            stop_real_mining,
            get_real_mining_stats,
            is_real_mining,
            start_node,
            stop_node,
            get_node_status,
            is_node_running,
            list_running_nodes,
            get_node_log_snapshot,
            get_boing_validator_identity,
            join_boing_stake_validator,
            get_tunnel_settings,
            set_tunnel_settings,
            start_cloudflare_tunnel,
            stop_cloudflare_tunnel,
            is_cloudflare_tunnel_running,
            get_cloudflare_tunnel_log_snapshot,
        ]);

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_and_focus_main(app);
        }));
    }

    let app = builder
        .setup(|app| {
            create_tray(app.handle())?;
            attach_window_close_handlers(app)?;
            let icon_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("icons").join("icon.png");
            if let Ok(icon) = Image::from_path(&icon_path) {
                let icon = icon.to_owned();
                for label in ["main", "splashscreen"] {
                    if let Some(window) = app.handle().get_webview_window(label) {
                        let _ = window.set_icon(icon.clone());
                    }
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            if let Ok(dir) = app_handle.path().app_data_dir() {
                node::shutdown_all_node_processes(&dir);
            }
            tunnel::stop_cloudflare_tunnel();
        }
        if let RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}
