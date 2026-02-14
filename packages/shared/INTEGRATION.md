# Blockchain network integration contract

This document defines the **exact** payload and rules required for a new blockchain network to be added to Vibe Mine. Following it ensures 100% compatibility and no runtime malfunctions.

## Environments

- **`mainnet`** — Production. Miners and networks stay in sync; real rewards.
- **`devnet`** — Testing. For networks and miners to validate integration before mainnet. No real value.

## Required fields

Every network object **must** include:

| Field         | Type   | Rules |
|----------------|--------|--------|
| `id`           | string | 1–64 chars. Lowercase letters, numbers, hyphens only. Must match `^[a-z0-9][a-z0-9-]*[a-z0-9]$` or single `[a-z0-9]`. |
| `name`         | string | 1–128 chars. Display name. |
| `symbol`       | string | 1–16 chars. Ticker (e.g. `XMR`, `KAS`). |
| `description`  | string | 1–512 chars. Short summary for the UI. |
| `icon`         | string | 1–500 chars. Emoji or icon URL. |
| `algorithm`    | string | 1–64 chars. Mining algorithm name. |
| `environment`  | string | **Exactly** `"mainnet"` or `"devnet"`. |
| `status`       | string | **Exactly** `"live"` \| `"coming-soon"` \| `"requested"`. Only `live` networks can be mined. |

## Optional fields

| Field        | Type   | Rules |
|-------------|--------|--------|
| `poolUrl`   | string | Valid URL or hostname (e.g. `pool.example.com`), max 256 chars. |
| `poolPort`  | number | Integer 1–65535. |
| `website`   | string | Valid URL, max 256 chars. |
| `rewardRate`| string | Human-readable estimate, max 128 chars (e.g. `"~0.001 XMR/day"`). |
| `minPayout` | string | Human-readable minimum payout, max 64 chars. |
| `requestedBy` | string | Who requested the service, max 128 chars. |

## Validation

- All data is validated at load time with Zod. Invalid entries are **skipped** (and reported in dev); only valid networks appear in the app.
- To add a network: extend `MAINNET_NETWORKS_RAW` or `DEVNET_NETWORKS_RAW` in `packages/shared/src/networks.ts` with an object that satisfies the schema. No code changes elsewhere are required.
- For programmatic registration (e.g. API), use `parseNetwork(raw)` for a single network or `parseNetworkList(raw)` for an array. Use `registerNetwork(raw)` to validate and return a network (throws on invalid).

## Example (mainnet)

```json
{
  "id": "my-chain",
  "name": "My Chain",
  "symbol": "MYC",
  "description": "A proof-of-work chain that needs hashrate.",
  "icon": "⛓",
  "algorithm": "MyAlgo",
  "environment": "mainnet",
  "status": "live",
  "poolUrl": "pool.mychain.com",
  "poolPort": 3333,
  "website": "https://mychain.com",
  "rewardRate": "Variable",
  "minPayout": "1 MYC"
}
```

## Example (devnet)

```json
{
  "id": "my-chain-devnet",
  "name": "My Chain (Devnet)",
  "symbol": "MYC",
  "description": "Test network for My Chain. No real value.",
  "icon": "⛓",
  "algorithm": "MyAlgo",
  "environment": "devnet",
  "status": "live",
  "website": "https://mychain.com",
  "rewardRate": "Test only",
  "minPayout": "N/A"
}
```

## IDs and environments

- **Mainnet** and **devnet** can each have a network with the same logical chain (e.g. `monero` mainnet and `monero-devnet` devnet). IDs must be unique across the registry; typically devnet IDs are suffixed with `-devnet`.
- The app resolves a network by `id` + optional `environment`. Always pass `environment` when looking up by ID if both mainnet and devnet versions exist.

## Adding a new network (code)

1. Open `packages/shared/src/networks.ts`.
2. Add a new object to `MAINNET_NETWORKS_RAW` or `DEVNET_NETWORKS_RAW` with all required fields and any optional ones.
3. Ensure `id` is unique and matches the regex.
4. Save. Validated lists (`getMainnetNetworks()`, `getDevnetNetworks()`, `getNetworkById()`) update automatically. No other files need changes.
