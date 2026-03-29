use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

const SETTINGS_FILENAME: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default = "default_auto_update")]
    pub auto_update: bool,
    /// Full path to `cloudflared` when not on PATH / Boing layout / default install dirs.
    #[serde(default)]
    pub cloudflared_path: Option<String>,
    /// Tunnel name from Cloudflare config (e.g. `boing-testnet-rpc`).
    #[serde(default)]
    pub cloudflare_tunnel_name: Option<String>,
    /// Override for `config.yml` (default: `%USERPROFILE%\.cloudflared\config.yml` / `~/.cloudflared/config.yml`).
    #[serde(default)]
    pub cloudflare_config_path: Option<String>,
    /// When true, starting a Boing node starts `cloudflared` if idle; stopping that node stops a tunnel we started.
    #[serde(default = "default_link_tunnel_with_boing_node")]
    pub link_tunnel_with_boing_node: bool,
}

fn default_auto_update() -> bool {
    true
}

fn default_link_tunnel_with_boing_node() -> bool {
    true
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            auto_update: true,
            cloudflared_path: None,
            cloudflare_tunnel_name: None,
            cloudflare_config_path: None,
            link_tunnel_with_boing_node: true,
        }
    }
}

pub fn settings_path(app_data_dir: &Path) -> std::path::PathBuf {
    app_data_dir.join(SETTINGS_FILENAME)
}

pub fn load(app_data_dir: &Path) -> Settings {
    let path = settings_path(app_data_dir);
    if let Ok(data) = fs::read_to_string(&path) {
        if let Ok(s) = serde_json::from_str::<Settings>(&data) {
            return s;
        }
    }
    Settings::default()
}

pub fn save(app_data_dir: &Path, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app_data_dir);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}
