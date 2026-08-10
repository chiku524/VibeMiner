//! VaultL1 (`vaultd`) home bootstrap for VibeMiner one-click A/B / local dual.
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Env: absolute path to `vaultd`. When set, VibeMiner **skips** the zip download for vaultl1
/// networks (same idea as `VIBEMINER_BOING_NODE_EXE`).
pub const VIBEMINER_VAULTD_EXE_ENV: &str = "VIBEMINER_VAULTD_EXE";

const CHAIN_ID_LAN: &str = "vault-net-1";
const CHAIN_ID_LOCAL: &str = "vault-net-local";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VaultRole {
    PcA,
    PcB,
    LocalA,
    LocalB,
}

#[derive(Debug, Clone, Default)]
pub struct VaultJoinOpts {
    pub peer_host: Option<String>,
    pub peer_address: Option<String>,
    pub peer_pubkey: Option<String>,
    pub genesis_path: Option<String>,
    pub genesis_json: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultPrepareInfo {
    pub role: String,
    pub home: String,
    pub address: String,
    pub pub_key_hex: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub genesis_export_path: Option<String>,
    pub moniker: String,
    pub chain_id: String,
}

pub fn is_vaultl1_network_id(network_id: &str) -> bool {
    network_id.to_lowercase().contains("vaultl1")
}

/// Only when `VIBEMINER_VAULTD_EXE` is set (Boing-style). Auto-discovery is not used for
/// production one-click — downloads come from the network preset URL.
pub fn vault_local_exe_from_env(network_id: &str) -> Result<Option<PathBuf>, String> {
    if !is_vaultl1_network_id(network_id) {
        return Ok(None);
    }
    let raw = match std::env::var(VIBEMINER_VAULTD_EXE_ENV) {
        Ok(s) => s,
        Err(_) => return Ok(None),
    };
    let t = raw.trim();
    if t.is_empty() {
        return Ok(None);
    }
    let p = PathBuf::from(t);
    if !p.is_absolute() {
        return Err(format!(
            "{VIBEMINER_VAULTD_EXE_ENV} must be an absolute path (got {t})"
        ));
    }
    if !p.exists() {
        return Err(format!(
            "{VIBEMINER_VAULTD_EXE_ENV} file not found: {}",
            p.display()
        ));
    }
    Ok(Some(p))
}

/// Resolve vaultd for prepare/start: preferred env path, else first token of template under bin_dir.
pub fn resolve_vaultd_for_start(
    local_env_exe: Option<&Path>,
    bin_dir: &Path,
    command_template: &str,
) -> Result<PathBuf, String> {
    if let Some(p) = local_env_exe {
        return Ok(p.to_path_buf());
    }
    let parts: Vec<&str> = command_template.split_whitespace().collect();
    let token = parts
        .first()
        .map(|s| s.trim_matches('"'))
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "Empty VaultL1 command template".to_string())?;
    let candidate = if Path::new(token).is_absolute() {
        PathBuf::from(token)
    } else {
        bin_dir.join(token)
    };
    if candidate.exists() {
        return Ok(candidate);
    }
    #[cfg(windows)]
    {
        if !token.ends_with(".exe") {
            let with_exe = bin_dir.join(format!("{token}.exe"));
            if with_exe.exists() {
                return Ok(with_exe);
            }
        }
    }
    // Fallbacks after zip extract (release ships both named + short)
    for name in ["vaultd.exe", "vaultd", "vaultd-windows-x86_64.exe", "vaultd-linux-x86_64", "vaultd-macos-aarch64"] {
        let p = bin_dir.join(name);
        if p.exists() {
            return Ok(p);
        }
    }
    // Nested extract (zip root folder)
    if let Ok(rd) = std::fs::read_dir(bin_dir) {
        for ent in rd.flatten() {
            let p = ent.path();
            if p.is_file() {
                let n = p.file_name().and_then(|x| x.to_str()).unwrap_or("");
                if n.starts_with("vaultd") {
                    return Ok(p);
                }
            }
            if p.is_dir() {
                for name in [
                    "vaultd.exe",
                    "vaultd",
                    "vaultd-windows-x86_64.exe",
                    "vaultd-linux-x86_64",
                    "vaultd-macos-aarch64",
                ] {
                    let nested = p.join(name);
                    if nested.exists() {
                        return Ok(nested);
                    }
                }
            }
        }
    }
    Err(format!(
        "vaultd not found under {} (download failed or wrong release zip). Template binary: {token}",
        bin_dir.display()
    ))
}

pub fn role_from_preset_id(preset_id: &str) -> Option<VaultRole> {
    let p = preset_id.to_lowercase();
    if p.contains("local-a") {
        return Some(VaultRole::LocalA);
    }
    if p.contains("local-b") {
        return Some(VaultRole::LocalB);
    }
    if p.contains("pc-a") || p.contains("machine-a") {
        return Some(VaultRole::PcA);
    }
    if p.contains("pc-b") || p.contains("machine-b") || p.contains("joiner") {
        return Some(VaultRole::PcB);
    }
    None
}

fn role_label(r: VaultRole) -> &'static str {
    match r {
        VaultRole::PcA => "pc-a",
        VaultRole::PcB => "pc-b",
        VaultRole::LocalA => "local-a",
        VaultRole::LocalB => "local-b",
    }
}

fn moniker_for(r: VaultRole) -> &'static str {
    match r {
        VaultRole::PcA => "machine-a",
        VaultRole::PcB => "machine-b",
        VaultRole::LocalA => "node-a",
        VaultRole::LocalB => "node-b",
    }
}

fn chain_id_for(r: VaultRole) -> &'static str {
    match r {
        VaultRole::LocalA | VaultRole::LocalB => CHAIN_ID_LOCAL,
        VaultRole::PcA | VaultRole::PcB => CHAIN_ID_LAN,
    }
}

fn state_db_exists(home: &Path) -> bool {
    home.join("data").join("state.db").exists()
}

fn genesis_path(home: &Path) -> PathBuf {
    home.join("config").join("genesis.json")
}

fn genesis_validator_count(home: &Path) -> usize {
    let p = genesis_path(home);
    let Ok(raw) = std::fs::read_to_string(&p) else {
        return 0;
    };
    let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) else {
        return 0;
    };
    v.get("validators")
        .and_then(|x| x.as_array())
        .map(|a| a.len())
        .unwrap_or(0)
}

fn run_vaultd(exe: &Path, args: &[&str]) -> Result<String, String> {
    let out = Command::new(exe)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run vaultd: {e}"))?;
    if !out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        let stdout = String::from_utf8_lossy(&out.stdout);
        return Err(format!(
            "vaultd {} failed: {} {}",
            args.first().unwrap_or(&""),
            stdout.trim(),
            stderr.trim()
        )
        .trim()
        .to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn ensure_init(exe: &Path, home: &Path, moniker: &str, chain_id: &str) -> Result<(), String> {
    let gen = genesis_path(home);
    if gen.exists() {
        return Ok(());
    }
    std::fs::create_dir_all(home).map_err(|e| e.to_string())?;
    let home_s = home.to_string_lossy();
    run_vaultd(
        exe,
        &[
            "init",
            "--home",
            home_s.as_ref(),
            "--chain-id",
            chain_id,
            moniker,
        ],
    )?;
    Ok(())
}

fn key_exists(exe: &Path, home: &Path, name: &str) -> bool {
    let home_s = home.to_string_lossy();
    run_vaultd(exe, &["keys", "show", name, "--home", home_s.as_ref()]).is_ok()
}

fn ensure_key(exe: &Path, home: &Path, name: &str) -> Result<(), String> {
    if key_exists(exe, home, name) {
        return Ok(());
    }
    let home_s = home.to_string_lossy();
    run_vaultd(exe, &["keys", "add", name, "--home", home_s.as_ref()])?;
    Ok(())
}

fn show_address(exe: &Path, home: &Path, name: &str) -> Result<String, String> {
    let home_s = home.to_string_lossy();
    let out = run_vaultd(exe, &["keys", "show", name, "--home", home_s.as_ref()])?;
    let line = out.lines().next().unwrap_or("").trim();
    if line.is_empty() {
        return Err(format!("empty address for key {name}"));
    }
    Ok(line.to_string())
}

fn show_pubkey(exe: &Path, home: &Path, name: &str) -> Result<(String, String), String> {
    let home_s = home.to_string_lossy();
    let out = run_vaultd(
        exe,
        &["keys", "show", name, "--home", home_s.as_ref(), "--pubkey"],
    )?;
    let mut lines = out.lines().map(|l| l.trim()).filter(|l| !l.is_empty());
    let addr = lines
        .next()
        .ok_or_else(|| "missing address from --pubkey".to_string())?
        .to_string();
    let pk = lines
        .next()
        .ok_or_else(|| "missing pubkey from --pubkey".to_string())?
        .to_string();
    Ok((addr, pk))
}

fn sanitize_host(raw: &str) -> Result<String, String> {
    let t = raw.trim();
    if t.is_empty() {
        return Err("Peer host is empty".into());
    }
    if t.len() > 64 || !t.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | ':' | '-' | '_')) {
        return Err("Peer host looks invalid".into());
    }
    Ok(t.to_string())
}

fn sanitize_hex_pubkey(raw: &str) -> Result<String, String> {
    let t = raw.trim().to_lowercase();
    if t.len() < 32 || t.len() > 128 || !t.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("Peer validator pubkey must be hex".into());
    }
    Ok(t)
}

fn sanitize_address(raw: &str) -> Result<String, String> {
    let t = raw.trim();
    if t.len() < 8 || t.len() > 128 {
        return Err("Peer validator address looks invalid".into());
    }
    if !t.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err("Peer validator address must be alphanumeric".into());
    }
    Ok(t.to_string())
}

/// Local dual: shared genesis dir under network node cache (sibling of data/).
fn local_dual_shared_dir(data_dir: &Path) -> PathBuf {
    // .../nodes/KEY/data/<preset> → .../nodes/KEY/local-dual
    data_dir
        .parent() // preset
        .and_then(|p| p.parent()) // data
        .map(|node| node.join("local-dual"))
        .unwrap_or_else(|| data_dir.join("local-dual"))
}

fn reset_empty_genesis_if_needed(exe: &Path, home: &Path, moniker: &str, chain_id: &str) -> Result<(), String> {
    if state_db_exists(home) {
        return Ok(());
    }
    // Wipe accounts/validators if we will rebuild (empty or incomplete genesis).
    let n = genesis_validator_count(home);
    if n >= 2 {
        return Ok(());
    }
    let gen = genesis_path(home);
    if gen.exists() {
        let _ = std::fs::remove_file(&gen);
    }
    // Force re-init of genesis file only — InitHome skips if genesis exists
    let home_s = home.to_string_lossy();
    run_vaultd(
        exe,
        &[
            "init",
            "--home",
            home_s.as_ref(),
            "--chain-id",
            chain_id,
            moniker,
        ],
    )?;
    Ok(())
}

fn build_coordinator_genesis(
    exe: &Path,
    home: &Path,
    peer_address: &str,
    peer_pubkey: &str,
) -> Result<PathBuf, String> {
    let home_s = home.to_string_lossy();
    let val_a = show_address(exe, home, "validator")?;
    let alice = show_address(exe, home, "alice")?;
    let peer_addr = sanitize_address(peer_address)?;
    let peer_pk = sanitize_hex_pubkey(peer_pubkey)?;

    let _ = run_vaultd(
        exe,
        &[
            "genesis",
            "add-genesis-account",
            &val_a,
            "100000000000000uvault",
            "--home",
            home_s.as_ref(),
        ],
    );
    let _ = run_vaultd(
        exe,
        &[
            "genesis",
            "add-genesis-account",
            &peer_addr,
            "1000000000000uvault",
            "--home",
            home_s.as_ref(),
        ],
    );
    let _ = run_vaultd(
        exe,
        &[
            "genesis",
            "add-genesis-account",
            &alice,
            "50000000000000uvault",
            "--home",
            home_s.as_ref(),
        ],
    );
    run_vaultd(
        exe,
        &[
            "genesis",
            "add-genesis-validator",
            "validator",
            "1",
            "--home",
            home_s.as_ref(),
        ],
    )?;
    run_vaultd(
        exe,
        &[
            "genesis",
            "add-validator",
            &peer_addr,
            &peer_pk,
            "1",
            "--name",
            "validator-b",
            "--home",
            home_s.as_ref(),
        ],
    )?;

    let export = home.join("genesis-shared.json");
    let export_s = export.to_string_lossy();
    run_vaultd(
        exe,
        &[
            "genesis",
            "export",
            export_s.as_ref(),
            "--home",
            home_s.as_ref(),
        ],
    )?;
    Ok(export)
}

fn import_genesis(exe: &Path, home: &Path, path: &Path) -> Result<(), String> {
    if !path.is_file() {
        return Err(format!("Genesis file not found: {}", path.display()));
    }
    let home_s = home.to_string_lossy();
    let path_s = path.to_string_lossy();
    run_vaultd(
        exe,
        &[
            "genesis",
            "import",
            path_s.as_ref(),
            "--force",
            "--home",
            home_s.as_ref(),
        ],
    )?;
    Ok(())
}

/// Bootstrap keyring + genesis for the role, or error with guidance.
pub fn prepare_vaultl1_home(
    exe: &Path,
    home: &Path,
    preset_id: &str,
    opts: &VaultJoinOpts,
) -> Result<VaultPrepareInfo, String> {
    let role = role_from_preset_id(preset_id).ok_or_else(|| {
        format!(
            "Unknown VaultL1 role in preset `{preset_id}` (expected pc-a, pc-b, local-a, local-b)"
        )
    })?;
    let moniker = moniker_for(role);
    let chain_id = chain_id_for(role);

    std::fs::create_dir_all(home).map_err(|e| e.to_string())?;
    let mut genesis_export_path: Option<String> = None;

    match role {
        VaultRole::LocalA => {
            ensure_init(exe, home, moniker, chain_id)?;
            ensure_key(exe, home, "validator")?;
            ensure_key(exe, home, "alice")?;
            let _ = show_pubkey(exe, home, "validator")?; // ensure key readable
    
            // Local dual genesis is built into A, exported once, then B imports.
            if !state_db_exists(home) && genesis_validator_count(home) < 2 {
                let shared = local_dual_shared_dir(home);
                std::fs::create_dir_all(&shared).map_err(|e| e.to_string())?;
                let b_home = shared.join("node-b-home");
                // We generate B keys under shared dual dir (key material also on A machine only for local dual)
                ensure_init(exe, &b_home, "node-b", chain_id)?;
                ensure_key(exe, &b_home, "validator")?;
                let (val_b, pub_b) = show_pubkey(exe, &b_home, "validator")?;

                reset_empty_genesis_if_needed(exe, home, moniker, chain_id)?;
                ensure_key(exe, home, "alice")?;
                // Rebuild only if still incomplete
                if genesis_validator_count(home) < 2 {
                    // clear partial accounts by resetting genesis
                    let gen = genesis_path(home);
                    if gen.exists() && !state_db_exists(home) {
                        let _ = std::fs::remove_file(&gen);
                        ensure_init(exe, home, moniker, chain_id)?;
                        ensure_key(exe, home, "validator")?;
                        ensure_key(exe, home, "alice")?;
                    }
                    let export = build_coordinator_genesis(exe, home, &val_b, &pub_b)?;
                    // import into staged B home
                    import_genesis(exe, &b_home, &export)?;
                    // also place export for user
                    let shared_gen = shared.join("genesis-shared.json");
                    let _ = std::fs::copy(&export, &shared_gen);
                    genesis_export_path = Some(export.display().to_string());
                    // stash B keyring so LocalB can copy it
                    let marker = shared.join("peer-b.json");
                    let _ = std::fs::write(
                        &marker,
                        serde_json::json!({
                            "address": val_b,
                            "pubKey": pub_b,
                            "bHome": b_home.display().to_string(),
                        })
                        .to_string(),
                    );
                }
            }
            if genesis_export_path.is_none() {
                let export = home.join("genesis-shared.json");
                if export.is_file() {
                    genesis_export_path = Some(export.display().to_string());
                }
            }
        }
        VaultRole::LocalB => {
            let shared = local_dual_shared_dir(home);
            let b_src = shared.join("node-b-home");
            let shared_gen = shared.join("genesis-shared.json");
            if !state_db_exists(home) {
                if !b_src.exists() || !shared_gen.is_file() {
                    return Err(
                        "Start **Local dual — node A** first (same PC). It prepares shared genesis and B keys."
                            .into(),
                    );
                }
                // Copy B keyring + import genesis into this data dir
                copy_dir_recursive(&b_src, home)?;
            }
            if genesis_validator_count(home) < 2 {
                import_genesis(exe, home, &shared_gen)?;
            }
        }
        VaultRole::PcA => {
            ensure_init(exe, home, moniker, chain_id)?;
            ensure_key(exe, home, "validator")?;
            ensure_key(exe, home, "alice")?;
            if !state_db_exists(home) && genesis_validator_count(home) < 2 {
                let peer_addr = opts
                    .peer_address
                    .as_deref()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| {
                        "PC A needs PC B validator **address** (from B's identity panel).".to_string()
                    })?;
                let peer_pk = opts
                    .peer_pubkey
                    .as_deref()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| {
                        "PC A needs PC B validator **pubkey** (hex from B's identity panel).".to_string()
                    })?;
                // peer host required for peer template sanity
                if let Some(h) = opts.peer_host.as_deref() {
                    let _ = sanitize_host(h)?;
                } else {
                    return Err("PC A needs peer host (PC B LAN IP) before start.".into());
                }
                reset_empty_genesis_if_needed(exe, home, moniker, chain_id)?;
                ensure_key(exe, home, "validator")?;
                ensure_key(exe, home, "alice")?;
                if genesis_validator_count(home) < 2 {
                    let gen = genesis_path(home);
                    if gen.exists() {
                        let _ = std::fs::remove_file(&gen);
                        ensure_init(exe, home, moniker, chain_id)?;
                        ensure_key(exe, home, "validator")?;
                        ensure_key(exe, home, "alice")?;
                    }
                    let export = build_coordinator_genesis(exe, home, peer_addr, peer_pk)?;
                    genesis_export_path = Some(export.display().to_string());
                }
            } else if home.join("genesis-shared.json").is_file() {
                genesis_export_path = Some(home.join("genesis-shared.json").display().to_string());
            }
        }
        VaultRole::PcB => {
            ensure_init(exe, home, moniker, chain_id)?;
            ensure_key(exe, home, "validator")?;
            let (addr_early, pk_early) = show_pubkey(exe, home, "validator")?;
            if !state_db_exists(home) && genesis_validator_count(home) < 2 {
                // Write pasted genesis if provided
                if let Some(json) = opts.genesis_json.as_deref().map(str::trim).filter(|s| !s.is_empty())
                {
                    if !json.starts_with('{') {
                        return Err("Genesis paste must be a JSON object".into());
                    }
                    let staged = home.join("genesis-import.json");
                    std::fs::write(&staged, json).map_err(|e| e.to_string())?;
                    import_genesis(exe, home, &staged)?;
                } else if let Some(path) = opts
                    .genesis_path
                    .as_deref()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                {
                    import_genesis(exe, home, Path::new(path))?;
                } else {
                    return Err(format!(
                        "PC B identity ready. Copy these to PC A, then import genesis and start:\n\
                         address={addr_early}\npubkey={pk_early}\n\
                         Provide genesis JSON path/paste after PC A builds genesis-shared.json."
                    ));
                }
            }
            if let Some(h) = opts.peer_host.as_deref() {
                let _ = sanitize_host(h)?;
            } else if !state_db_exists(home) {
                return Err("PC B needs peer host (PC A LAN IP) before start.".into());
            }
        }
    }

    let (address, pub_key_hex) = show_pubkey(exe, home, "validator")?;

    // Final guard: must have 2 validators before start
    if genesis_validator_count(home) < 2 {
        return Err(format!(
            "VaultL1 genesis not ready (validators < 2). Role={} address={} pubkey={}",
            role_label(role),
            address,
            pub_key_hex
        ));
    }

    Ok(VaultPrepareInfo {
        role: role_label(role).to_string(),
        home: home.display().to_string(),
        address,
        pub_key_hex,
        genesis_export_path,
        moniker: moniker.to_string(),
        chain_id: chain_id.to_string(),
    })
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for entry in std::fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let ty = entry.file_type().map_err(|e| e.to_string())?;
        let to = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_recursive(&entry.path(), &to)?;
        } else {
            std::fs::copy(entry.path(), &to).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Apply `{peerHost}` in command template.
pub fn apply_peer_host_template(template: &str, opts: &VaultJoinOpts, preset_id: &str) -> Result<String, String> {
    let role = role_from_preset_id(preset_id);
    let default_host = match role {
        Some(VaultRole::LocalA) | Some(VaultRole::LocalB) => "127.0.0.1",
        _ => "",
    };
    let host_raw = opts
        .peer_host
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(default_host);
    if template.contains("{peerHost}") {
        if host_raw.is_empty() {
            return Err("Set peer host (other PC LAN IP) for this VaultL1 role".into());
        }
        let host = sanitize_host(host_raw)?;
        return Ok(template.replace("{peerHost}", &host));
    }
    Ok(template.to_string())
}
