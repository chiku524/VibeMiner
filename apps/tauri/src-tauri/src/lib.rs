#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mining;
mod node;
mod settings;

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
    if url.is_empty() {
        return Ok(serde_json::json!({ "ok": false, "error": "No node download URL" }));
    }
    if template.is_empty() {
        return Ok(serde_json::json!({ "ok": false, "error": "No node command template" }));
    }
    let window_emit = window.clone();
    let user_data_path = user_data.clone();
    let id_for_ready = network_id.clone();
    let env_for_ready = env.clone();
    let url_for_ready = url.clone();
    let preset_for_ready = preset_raw.clone();
    let (bin_dir, data_dir) = tauri::async_runtime::spawn_blocking(move || {
        node::ensure_node_ready(
            &id_for_ready,
            &env_for_ready,
            &preset_for_ready,
            &url_for_ready,
            sha.as_deref(),
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
    .map_err(|e| e.to_string())??;
    node::start_node(
        &app,
        network_id,
        env,
        &preset_raw,
        &template,
        &bin_dir,
        &data_dir,
    )?;
    Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
fn stop_node(network_id: String, environment: String, node_preset_id: Option<String>) {
    let pid = node_preset_id.as_deref().unwrap_or("default");
    node::stop_node(&network_id, &environment, pid);
}

#[tauri::command]
fn get_node_status(network_id: String, environment: String, node_preset_id: Option<String>) -> Option<serde_json::Value> {
    let pid = node_preset_id.as_deref().unwrap_or("default");
    node::get_node_status(&network_id, &environment, pid).map(|s| {
        serde_json::json!({
            "startedAt": s.started_at,
            "status": s.status,
            "isActive": s.is_active
        })
    })
}

#[tauri::command]
fn is_node_running(network_id: String, environment: String, node_preset_id: Option<String>) -> bool {
    let pid = node_preset_id.as_deref().unwrap_or("default");
    node::is_node_running(&network_id, &environment, pid)
}

#[tauri::command]
fn list_running_nodes() -> Vec<node::RunningNodeDescriptor> {
    node::list_running_nodes()
}

#[tauri::command]
fn get_node_log_snapshot(
    network_id: String,
    environment: String,
    node_preset_id: Option<String>,
) -> Vec<node::NodeLogLineEntry> {
    let pid = node_preset_id.as_deref().unwrap_or("default");
    node::get_node_log_snapshot(&network_id, &environment, pid)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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

    app.run(|_app_handle, event| {
        if let RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}
