//! Boing public stake-validator identity + one-click Bond join helpers.
//!
//! Secrets are stored under app data and injected via `BOING_VALIDATOR_KEY` (never logged in argv).

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};

use crate::node;

const KEY_FILE: &str = "validator-key.json";
/// Matches `boing_tokenomics::MIN_VALIDATOR_STAKE`.
pub const MIN_VALIDATOR_STAKE: u128 = 10_000;
/// Bond gas units × `GAS_PRICE` (1) — leave headroom for fee market.
const BOND_FEE_RESERVE: u128 = 25_000;
/// Target balance before Bond: stake + fee reserve.
const TARGET_BALANCE_BEFORE_BOND: u128 = MIN_VALIDATOR_STAKE + BOND_FEE_RESERVE;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValidatorKeyFile {
    /// 64 hex chars (no 0x) — Ed25519 seed.
    secret_hex: String,
    /// 0x + 64 hex — AccountId / public key.
    account_id_hex: String,
    created_at_unix: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BoingValidatorIdentity {
    pub account_id_hex: String,
    pub key_path: String,
    pub is_public_stake_preset: bool,
}

pub fn is_public_stake_validator_preset(preset_id: &str) -> bool {
    let p = preset_id.to_lowercase();
    p.contains("public-validator") || p.contains("stake-validator")
}

fn keys_dir(user_data: &Path, network_id: &str, environment: &str) -> PathBuf {
    let key = node::node_dir_key(network_id, environment);
    user_data.join("nodes").join(key).join("keys")
}

fn key_file_path(user_data: &Path, network_id: &str, environment: &str, preset_id: &str) -> PathBuf {
    let safe = node::sanitize_preset_id(preset_id);
    keys_dir(user_data, network_id, environment).join(format!("{safe}-{KEY_FILE}"))
}

fn account_id_hex_from_secret(secret: &[u8; 32]) -> String {
    let sk = SigningKey::from_bytes(secret);
    let pk = sk.verifying_key().to_bytes();
    format!("0x{}", hex::encode(pk))
}

/// Load or create a persistent Ed25519 validator key for this network/preset.
pub fn ensure_validator_key(
    user_data: &Path,
    network_id: &str,
    environment: &str,
    preset_id: &str,
) -> Result<BoingValidatorIdentity, String> {
    let path = key_file_path(user_data, network_id, environment, preset_id);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("create keys dir: {e}"))?;
    }

    if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| format!("read validator key: {e}"))?;
        let parsed: ValidatorKeyFile =
            serde_json::from_str(&raw).map_err(|e| format!("parse validator key: {e}"))?;
        let secret = decode_secret_hex(&parsed.secret_hex)?;
        let expected = account_id_hex_from_secret(&secret);
        if !parsed.account_id_hex.eq_ignore_ascii_case(&expected) {
            return Err("stored validator key AccountId does not match secret".into());
        }
        return Ok(BoingValidatorIdentity {
            account_id_hex: expected,
            key_path: path.display().to_string(),
            is_public_stake_preset: is_public_stake_validator_preset(preset_id),
        });
    }

    let sk = SigningKey::generate(&mut OsRng);
    let secret = sk.to_bytes();
    let account_id_hex = account_id_hex_from_secret(&secret);
    let file = ValidatorKeyFile {
        secret_hex: hex::encode(secret),
        account_id_hex: account_id_hex.clone(),
        created_at_unix: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0),
    };
    let json = serde_json::to_string_pretty(&file).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("write validator key: {e}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o600));
    }

    Ok(BoingValidatorIdentity {
        account_id_hex,
        key_path: path.display().to_string(),
        is_public_stake_preset: is_public_stake_validator_preset(preset_id),
    })
}

fn decode_secret_hex(s: &str) -> Result<[u8; 32], String> {
    let hex = s.trim().strip_prefix("0x").unwrap_or(s.trim());
    let bytes = hex::decode(hex).map_err(|e| format!("invalid secret hex: {e}"))?;
    if bytes.len() != 32 {
        return Err(format!("secret must be 32 bytes, got {}", bytes.len()));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

pub fn load_secret_hex(
    user_data: &Path,
    network_id: &str,
    environment: &str,
    preset_id: &str,
) -> Result<String, String> {
    let path = key_file_path(user_data, network_id, environment, preset_id);
    let raw = fs::read_to_string(&path).map_err(|e| format!("read validator key: {e}"))?;
    let parsed: ValidatorKeyFile =
        serde_json::from_str(&raw).map_err(|e| format!("parse validator key: {e}"))?;
    let _ = decode_secret_hex(&parsed.secret_hex)?;
    Ok(parsed.secret_hex)
}

/// Inject stake-validator env into a `boing-node` Command (secret never appears in argv).
pub fn apply_public_stake_validator_env(
    cmd: &mut Command,
    user_data: &Path,
    network_id: &str,
    environment: &str,
    preset_id: &str,
) -> Result<Option<BoingValidatorIdentity>, String> {
    if !is_public_stake_validator_preset(preset_id) {
        return Ok(None);
    }
    let id = ensure_validator_key(user_data, network_id, environment, preset_id)?;
    let secret = load_secret_hex(user_data, network_id, environment, preset_id)?;
    // Prefer env so process listings / VibeMiner command logs never show the secret.
    if std::env::var_os("BOING_VALIDATOR_KEY").is_none() {
        cmd.env("BOING_VALIDATOR_KEY", &secret);
    }
    if std::env::var_os("BOING_VALIDATOR_SET").is_none() {
        cmd.env("BOING_VALIDATOR_SET", "stake");
    }
    if std::env::var_os("BOING_LEADER_ELECTION").is_none() {
        cmd.env("BOING_LEADER_ELECTION", "vrf");
    }
    Ok(Some(id))
}

/// Public Boing testnet JSON-RPC (faucet + Bond for the shared stake-derived set).
pub const BOING_TESTNET_PUBLIC_RPC_URL: &str = "https://testnet-rpc.boing.network/";

fn rpc_url_local(port: u16) -> String {
    format!("http://127.0.0.1:{port}")
}

fn json_rpc(url: &str, method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    });
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .post(url)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .map_err(|e| format!("RPC {method}: {e}"))?;
    let status = res.status();
    let v: serde_json::Value = res
        .json()
        .map_err(|e| format!("RPC {method} decode: {e}"))?;
    if !status.is_success() {
        return Err(format!("RPC {method} HTTP {status}: {v}"));
    }
    if let Some(err) = v.get("error") {
        let msg = err
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("rpc error");
        return Err(msg.to_string());
    }
    Ok(v.get("result").cloned().unwrap_or(serde_json::Value::Null))
}

fn wait_for_rpc(url: &str, attempts: u32) -> Result<(), String> {
    for i in 0..attempts {
        match json_rpc(url, "boing_chainHeight", serde_json::json!([])) {
            Ok(_) => return Ok(()),
            Err(e) => {
                if i + 1 == attempts {
                    return Err(format!("local RPC not ready at {url}: {e}"));
                }
                std::thread::sleep(Duration::from_millis(500));
            }
        }
    }
    Err("local RPC not ready".into())
}

fn parse_u128_field(v: &serde_json::Value, key: &str) -> u128 {
    v.get(key)
        .and_then(|x| {
            if let Some(s) = x.as_str() {
                s.parse().ok()
            } else if let Some(n) = x.as_u64() {
                Some(n as u128)
            } else {
                None
            }
        })
        .unwrap_or(0)
}

/// Encode + sign a Bond transaction (bincode layout matching boing-primitives).
fn encode_signed_bond(secret: &[u8; 32], nonce: u64, amount: u128) -> Result<String, String> {
    let sk = SigningKey::from_bytes(secret);
    let sender = sk.verifying_key().to_bytes();

    // AccessList { read: [sender], write: [sender] }
    let mut access = Vec::new();
    access.extend_from_slice(&1u64.to_le_bytes());
    access.extend_from_slice(&sender);
    access.extend_from_slice(&1u64.to_le_bytes());
    access.extend_from_slice(&sender);

    // Payload::Bond { amount } — discriminant 5
    let mut payload = Vec::new();
    payload.extend_from_slice(&5u32.to_le_bytes());
    payload.extend_from_slice(&amount.to_le_bytes());

    // Signable: BLAKE3(nonce_le || sender || bincode(payload) || bincode(access_list))
    let mut hasher = blake3::Hasher::new();
    hasher.update(&nonce.to_le_bytes());
    hasher.update(&sender);
    hasher.update(&payload);
    hasher.update(&access);
    let msg = *hasher.finalize().as_bytes();
    let sig = sk.sign(&msg);

    // Transaction bincode: nonce u64 || sender 32 || payload || access_list
    let mut tx = Vec::new();
    tx.extend_from_slice(&nonce.to_le_bytes());
    tx.extend_from_slice(&sender);
    tx.extend_from_slice(&payload);
    tx.extend_from_slice(&access);

    // SignedTransaction { tx, signature } — signature is [u8;64] as bytes in serde
    // bincode for struct: fields in order. Signature serializes as bytes via serialize_bytes
    // which for bincode is length-prefixed.
    let mut signed = Vec::new();
    signed.extend_from_slice(&tx);
    signed.extend_from_slice(&(64u64.to_le_bytes()));
    signed.extend_from_slice(&sig.to_bytes());

    Ok(format!("0x{}", hex::encode(signed)))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinStakeValidatorResult {
    pub ok: bool,
    pub account_id_hex: String,
    pub balance: String,
    pub stake: String,
    pub bonded: bool,
    pub message: String,
}

/// Faucet + Bond min stake so this identity can enter the public stake-derived set.
///
/// Defaults to the **public** testnet RPC (shared chain / top-N epochs). Pass
/// `rpc_url_override` (e.g. `http://127.0.0.1:8545`) for a solo local chain.
pub fn join_stake_validator(
    user_data: &Path,
    network_id: &str,
    environment: &str,
    preset_id: &str,
    rpc_url_override: Option<&str>,
    local_rpc_port: Option<u16>,
    max_faucet_attempts: u32,
) -> Result<JoinStakeValidatorResult, String> {
    if !is_public_stake_validator_preset(preset_id) {
        return Err("preset is not a public stake-validator preset".into());
    }
    let identity = ensure_validator_key(user_data, network_id, environment, preset_id)?;
    let secret = decode_secret_hex(&load_secret_hex(
        user_data, network_id, environment, preset_id,
    )?)?;
    let url = if let Some(u) = rpc_url_override.map(str::trim).filter(|s| !s.is_empty()) {
        u.to_string()
    } else if let Some(port) = local_rpc_port {
        rpc_url_local(port)
    } else {
        BOING_TESTNET_PUBLIC_RPC_URL.to_string()
    };
    wait_for_rpc(&url, 40)?;

    let account = identity.account_id_hex.clone();

    // Fund via faucet until we can Bond (50k dispense on current nodes; older nodes dispense 1k).
    let faucet_attempts = max_faucet_attempts.max(1);
    for attempt in 0..faucet_attempts {
        let acc = json_rpc(
            &url,
            "boing_getAccount",
            serde_json::json!([account]),
        )?;
        let balance = parse_u128_field(&acc, "balance");
        let stake = parse_u128_field(&acc, "stake");
        if stake >= MIN_VALIDATOR_STAKE {
            return Ok(JoinStakeValidatorResult {
                ok: true,
                account_id_hex: account,
                balance: balance.to_string(),
                stake: stake.to_string(),
                bonded: true,
                message: "Already staked at or above minimum validator stake.".into(),
            });
        }
        if balance >= TARGET_BALANCE_BEFORE_BOND {
            break;
        }
        match json_rpc(
            &url,
            "boing_faucetRequest",
            serde_json::json!([account]),
        ) {
            Ok(_) => {
                std::thread::sleep(Duration::from_secs(2));
            }
            Err(e) => {
                if attempt + 1 == faucet_attempts {
                    return Err(format!(
                        "faucet failed at {url} (need balance ≥ {TARGET_BALANCE_BEFORE_BOND}): {e}"
                    ));
                }
                std::thread::sleep(Duration::from_secs(2));
            }
        }
    }

    let acc = json_rpc(
        &url,
        "boing_getAccount",
        serde_json::json!([account]),
    )?;
    let balance = parse_u128_field(&acc, "balance");
    let stake = parse_u128_field(&acc, "stake");
    let nonce = parse_u128_field(&acc, "nonce") as u64;
    if stake >= MIN_VALIDATOR_STAKE {
        return Ok(JoinStakeValidatorResult {
            ok: true,
            account_id_hex: account,
            balance: balance.to_string(),
            stake: stake.to_string(),
            bonded: true,
            message: "Already staked.".into(),
        });
    }
    if balance < TARGET_BALANCE_BEFORE_BOND {
        return Err(format!(
            "balance {balance} too low to Bond {MIN_VALIDATOR_STAKE} (need ≥ {TARGET_BALANCE_BEFORE_BOND} including fees). Fund via faucet at {url} or wait for rate limits."
        ));
    }

    let signed = encode_signed_bond(&secret, nonce, MIN_VALIDATOR_STAKE)?;
    json_rpc(
        &url,
        "boing_submitTransaction",
        serde_json::json!([signed]),
    )?;

    // Allow a block to include the Bond (solo stake-mode node is the leader).
    std::thread::sleep(Duration::from_secs(3));
    let acc2 = json_rpc(
        &url,
        "boing_getAccount",
        serde_json::json!([account]),
    )?;
    let balance2 = parse_u128_field(&acc2, "balance");
    let stake2 = parse_u128_field(&acc2, "stake");
    let bonded = stake2 >= MIN_VALIDATOR_STAKE;
    Ok(JoinStakeValidatorResult {
        ok: bonded,
        account_id_hex: account,
        balance: balance2.to_string(),
        stake: stake2.to_string(),
        bonded,
        message: if bonded {
            format!(
                "Bonded {MIN_VALIDATOR_STAKE} BOING on {url}. Keep this node running with the same key; at the next stake epoch you compete in the top-N public set."
            )
        } else {
            "Bond submitted; stake not yet visible — wait for the next block and refresh.".into()
        },
    })
}
