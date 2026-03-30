# Boing Network Registration Checklist

Use this checklist to onboard Boing Network via VibeMiner’s Request listing form. No simulations—everything uses real data.

**Source of truth (live):** [https://boing.network/api/networks](https://boing.network/api/networks) — Boing’s registry (three ids by platform: `boing-devnet`, `boing-devnet-linux`, `boing-devnet-macos`). **VibeMiner static defaults** use a single id `boing-devnet` with **`nodePresets`** for Windows / Linux / macOS (same zips as the API). Prefer the live API when you need D1-updated SHA256 or URLs without shipping a new VibeMiner build.

**How VibeMiner models node downloads**

- Each listing still stores **one** top-level `node_download_url` for backward compatibility (mirrors the **first** preset’s effective URL after normalization). True multi-archive behavior uses **`nodePresets` JSON**: each preset may set **`nodeDownloadUrl`** and **`nodeBinarySha256`**, or omit the URL and inherit the shared listing URL.
- **Single node block** (default on the form): one URL + one command — e.g. **Boing** → **`boing-devnet`** for Windows.
- **Multiple node modes** (checkbox): use either **one shared URL** with different commands per mode, **or** leave the shared URL empty and set an **HTTPS download URL (and optional SHA256) per mode** — suitable for **Windows / Linux / macOS** zips on one listing.
- **Desktop:** archives are cached under **`bin/<url-hash-prefix>/`** with a per-URL **`.vm-ready/<prefix>.ok`** marker so switching presets does not reuse the wrong binary tree. **`get_platform()`** defaults the modal preset when id/label match `windows`, `linux`, `macos`, etc.

### Cross-OS in one listing — implemented

Use **Offer multiple node modes**, clear the **shared** node URL if you want only per-mode URLs, add one row per OS (ids like `windows`, `linux`, `macos-arm64` help auto-selection), and fill **Mode download URL** + optional **Archive SHA256** per row. The **Run node** action passes the selected preset’s effective URL and SHA into the desktop installer.

## Prerequisites

1. **Network account** — Register at [VibeMiner/register](https://vibeminer.tech/register) with account type **Network**
2. **DB migration** — Ensure node columns exist. From VibeMiner project root: `cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/001_add_node_columns.sql`

## Registration Steps

### 1. Go to the registration form

- Dashboard → Network (for network accounts) or [Request listing](https://vibeminer.tech/networks) if available
- The form is on the networks page for network accounts

### 2. Fill in basic info

| Field | Value |
|-------|-------|
| **Network name** | Boing |
| **Symbol** | BOING |
| **Environment** | Devnet |
| **Algorithm** | PoS (Proof of Stake; use **Run node** — no pool mining) |

### 3. Pool section

- **Leave blank** — Boing is PoS; no mining pools
- Pool URL and port are optional when node config is provided

### 4. Node support (expand this section)

#### A. Default: single node block — Windows, id `boing-devnet`

Use this when you are **not** enabling **Offer multiple node modes**. One download URL, one command. This **overrides** the static `boing-devnet` row in `@vibeminer/shared` so **Run node** uses your release.

**Current GitHub release tag:** `testnet-v0.1.3` (includes `boing_getQaRegistry` and related RPC; supersedes `testnet-v0.1.2`)  
**Repository:** [chiku524/boing.network](https://github.com/chiku524/boing.network) (push tag `testnet-v0.1.3` → CI builds zips → finish the **draft** GitHub Release)

**QA / explorer RPC:** Boing adds read-only methods over time (e.g. **`boing_getQaRegistry`** for [boing.observer/qa](https://boing.observer/qa)). VibeMiner only runs whatever is inside your zip — **no app update can add RPC methods**. When you ship a new `boing-node` with additional JSON-RPC, **tag a new release** (e.g. `testnet-v0.1.4`), update every download URL in this checklist and in `@vibeminer/shared` defaults (`BOING_TESTNET_DEFAULT_DOWNLOAD_TAG`, `networks.ts`), then redeploy VibeMiner. Details: **[BOING_QA_RPC_AND_RELEASES.md](./BOING_QA_RPC_AND_RELEASES.md)**.

| Field | Value |
|-------|-------|
| **Network name** | **Boing** (slug `boing` → stored id **`boing-devnet`** — required to merge with static Boing testnet) |
| **Node download URL** | `https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.3/release-windows-x86_64.zip` |
| **Command template** | `boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable` |
| **Binary SHA256** (optional, of the **zip** file) | *After the release is published, `sha256sum` the downloaded zip and paste here; omit until then.* |
| **Disk (GB)** | e.g. `10` (static `boing-devnet` default in `@vibeminer/shared`) |
| **RAM (MB)** | e.g. `2048` |

#### B. Multiple node modes (same Windows zip, different commands)

Enable **Offer multiple node modes** only when every preset uses the **same** `release-windows-x86_64.zip` (one URL for the whole listing). Typical use: **full node** vs **validator**.

Example presets (illustrative — adjust labels/descriptions as you like):

| Mode id | Label | Command template |
|---------|-------|------------------|
| `full-node` | Full node (Windows) | `boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable` |
| `validator` | Validator (Windows) | `boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable --validator` |

Use the **same** download URL and zip SHA as in section A for the listing (**shared** URL), or give each mode its **own** URL + optional SHA in the preset row (leave shared URL empty when every mode has a URL). Disk/RAM can be set per preset or inherited from the first row.

To ship **Linux/macOS** on the **same** listing id as Windows, add presets (e.g. `windows`, `linux`, `macos-aarch64`) with per-mode download URLs. **Section C** is still useful if you want **separate dashboard rows** per OS.

#### C. Linux and macOS — optional separate listings (extra dashboard rows)

Register **additional** networks if you want one listing id per platform instead of multi-preset **`boing-devnet`**.

**How VibeMiner builds the listing id:** for **Devnet**, the API stores **`{slug}-devnet`**, where `slug` comes from **Network name** (lowercase, non-alphanumeric → `-`). Examples: name **Boing** → `boing-devnet`; name **Boing Linux** → `boing-linux-devnet`. Boing’s own API may label rows differently — use the **Resulting VibeMiner listing id** column below when registering here.

| Platform | Suggested network name (form) | Resulting VibeMiner listing id | Node download URL | Command template |
|----------|------------------------------|----------------------------------|-------------------|------------------|
| **Linux x86_64** | `Boing Linux` | `boing-linux-devnet` | `https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.3/release-linux-x86_64.zip` | `boing-node-linux-x86_64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable` |
| **macOS Apple Silicon** | `Boing macOS aarch64` | `boing-macos-aarch64-devnet` | `https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.3/release-macos-aarch64.zip` | `boing-node-macos-aarch64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable` |

| Field | Linux / macOS zip SHA256 (optional) |
|-------|-------------------------------------|
| **Binary SHA256** | *Compute from published `testnet-v0.1.3` zips after CI finishes; omit until then.* |

These listings **do not** replace the static **`boing-devnet`** row; they show up as **extra** devnet networks. The primary **Boing (Testnet)** entry remains the Windows (or multi-preset Windows) registration with **`boing-devnet`**.

**Bootnodes / RPC (reference)** — same on all platforms:

- **Bootnodes (comma-separated for `--bootnodes`):** `/ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001` (matches `website/src/config/testnet.ts` default; duplicate is intentional)
- **Public RPC:** `https://testnet-rpc.boing.network/`
- **Chain ID (EIP-155 style):** `0x1b01` (6913)

**Command notes:**

- Flags use **hyphens** as in the released binary (`--data-dir`, `--p2p-listen`, `--bootnodes`, `--rpc-port`). Do not use underscore forms in the template.
- `{dataDir}` / `{data_dir}` are supported placeholders; the app quotes them when paths contain spaces.
- The zip layout matches the template: binaries sit at the **root** of each zip (`boing-node-windows-x86_64.exe`, etc.).
- **Validator (block production):** append `--validator` to the template if you want the default registration to start a validator; the templates above start a **full node** with P2P + RPC (same as [boing.network](https://boing.network/api/networks) D1 listing).

**Docs:** [Join testnet](https://boing.network/network/testnet), [TESTNET.md (repo)](https://github.com/chiku524/boing.network/blob/main/docs/TESTNET.md).

**Regenerating URLs + SHA256 after a new tag** (Boing repo, from `website/`):

```bash
node scripts/network-listings-release-sql.mjs <new-tag>
# Optional: apply to Boing’s D1
node scripts/network-listings-release-sql.mjs <new-tag> --apply
```

### 5. Other fields

| Field | Value |
|-------|-------|
| **Website** | https://boing.network |
| **Reward rate** | Test only |
| **Min. payout** | N/A |
| **Description** | At least 20 characters, e.g. *Boing testnet: run a full node or validator with one click. PoS chain—stake BOING to validate. JSON-RPC on port 8545; join via official bootnodes.* |

### 6. Submit

- Devnet is free; no listing fee
- After validation, the network appears in the dashboard
- If Boing already exists in the static list, the registered version (with node config) overrides it when the stored id is **`boing-devnet`** (name **Boing**, devnet). Linux/macOS listings use ids like **`boing-linux-devnet`** / **`boing-macos-aarch64-devnet`** and appear as additional rows.

## What Happens After Registration

1. **Dashboard** — Boing appears in the Devnet list with a "Light/Standard" resource badge (from disk/RAM)
2. **Run node** — Users open the modal and use **Run node** to download and start the binary. If the listing has **multiple node modes**, they pick a mode first (e.g. full node vs validator).
3. **No mining** — "Start mining" is disabled for PoS networks; only **Run node** is offered

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Pool URL is required" | Expand "Node support" and fill in Node download URL + Command template |
| "Node config validation failed" | Ensure download URL is HTTPS and host is allowlisted (`github.com`, `*.githubusercontent.com`, etc.) |
| "Command contains disallowed characters" | Avoid `;&|$\`<>()` in the command template. Use `{dataDir}` or `{data_dir}` for the data path. |
| Duplicate / conflict | Use network name **Boing** (→ **`boing-devnet`**) to replace the static row; Linux/macOS use separate names (→ **`boing-linux-devnet`**, etc.) |
| Mixed OS in one listing | Use **multiple node modes** with a **Mode download URL** per OS (shared URL can be empty), or use **section C** for separate listing ids |
| **Run node** / IPC errors | Confirm SHA256 matches the **downloaded file** (the zip). On Windows the binary is `boing-node-windows-x86_64.exe` inside the zip; the app may resolve `boing-node` → `.exe` when needed |
| Windows **“filename, directory name, or volume label syntax is incorrect” (os error 123)** | Fixed in the **desktop app** (VibeMiner ≥ **1.0.77**): node cache folders no longer use `:` in the path (`devnet__boing-devnet` instead of `devnet:boing-devnet`). **No change to your D1 listing** is required for Boing—command template and URLs stay as documented above. |
| API / probe failures | `GET` and `HEAD` are implemented for [https://boing.network/api/networks](https://boing.network/api/networks) |

## URL Allowlist

Node download URLs must be from hosts VibeMiner allows. See `packages/shared/src/nodes.ts` (`NODE_DOWNLOAD_ALLOWED_HOSTS`). GitHub release URLs under `github.com` and `githubusercontent.com` are valid.
