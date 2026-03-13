# Boing Network Registration Checklist

Use this checklist to onboard Boing Network via VibeMiner's Request listing form. No simulations—everything uses real data.

## Prerequisites

1. **Network account** — Register at [VibeMiner/register](https://vibeminer.tech/register) with account type **Network**
2. **DB migration** — Ensure node columns exist. From project root: `cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/001_add_node_columns.sql`

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
| **Algorithm** | PoS (Proof of Stake, no mining) |

### 3. Pool section

- **Leave blank** — Boing is PoS, no mining pools
- Pool URL and port are optional when node config is provided

### 4. Node support (expand this section)

| Field | Value |
|-------|-------|
| **Node download URL** | `https://github.com/boing-network/boing-network/releases/download/vX.Y.Z/boing-node-<platform>-<arch>.zip` (use actual release URL for your OS) |
| **Command template** | `boing-node --p2p_listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001 --validator --rpc-port 8545 --data-dir {dataDir}` (or use `{data_dir}`; both are supported) |
| **Disk (GB)** | e.g. 5 |
| **RAM (MB)** | e.g. 2048 |
| **Binary SHA256** | (optional) paste the SHA256 of the release asset for integrity verification |

**Bootnodes:** Replace the example with current testnet bootnodes from [TESTNET.md](https://github.com/boing-network/boing-network/blob/main/docs/TESTNET.md) §6 or [boing.network/network/testnet](https://boing.network/network/testnet).

**Command notes:** Windows builds may need `--no-default-features` (disable mDNS). Include all required flags for your platform.

### 5. Other fields

| Field | Value |
|-------|-------|
| **Website** | https://boing.network |
| **Reward rate** | Test only |
| **Min. payout** | N/A |
| **Description** | At least 20 characters, e.g. "Boing testnet: run a validator or full node with one click. PoS chain—stake BOING to validate. JSON-RPC on port 8545." |

### 6. Submit

- Devnet is free; no listing fee
- After validation, the network appears in the dashboard
- If Boing already exists in the static list, the registered version (with node config) overrides it

## What Happens After Registration

1. **Dashboard** — Boing appears in the Devnet list with a "Light/Standard" resource badge
2. **Run node** — Users click Boing, open the modal, and use "Run node" to download and start the binary
3. **No mining** — "Start mining" is disabled for PoS networks; only "Run node" is offered

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Pool URL is required" | Expand "Node support" and fill in Node download URL + Command template |
| "Node config validation failed" | Ensure download URL is from github.com (or another allowed host) |
| "Command contains disallowed characters" | Avoid `;&|$\`<>()` in the command template. Use `{dataDir}` or `{data_dir}` for the data path. |
| Duplicate / conflict | If Boing is already in the static list, the registered version overrides it |

## URL Allowlist

Node download URLs must be from: `github.com`, `releases.githubusercontent.com`, `getmonero.org`, `kaspa.org`, `ergoplatform.org`, `raptoreum.com`, etc. See `packages/shared/src/nodes.ts` for the full list.
