# Boing node RPC updates & VibeMiner

VibeMiner **does not implement** Boing JSON-RPC itself. It **downloads** a `boing-node` archive from your listing URL and runs the command template you configure. Any RPC method (including newer read-only calls) is entirely determined by **that binary’s version**.

## `boing_getQaRegistry` and QA transparency

The Boing monorepo exposes read-only **`boing_getQaRegistry`** so explorers (e.g. [boing.observer/qa](https://boing.observer/qa)) can show the live rule registry. If you see:

```json
{"error":{"code":-32601,"message":"Method not found: boing_getQaRegistry"}}
```

the process answering on **`--rpc-port`** was built **before** that method existed.

### Local node (VibeMiner) vs public RPC (boing.observer)

| Where you see the error | Which `boing-node` matters |
|-------------------------|----------------------------|
| **curl / wallet → `http://127.0.0.1:8545`** | The binary VibeMiner downloaded and started — update listing URL / default tag and restart. |
| **https://boing.observer/qa** | The **`boing-node` behind `NEXT_PUBLIC_TESTNET_RPC`** (default `https://testnet-rpc.boing.network`) — upgrade that deployment; your local VibeMiner binary does not fix the explorer. |

Same symptom, two different backends. See Boing repo **[THREE-CODEBASE-ALIGNMENT.md §2.1](https://github.com/chiku524/boing.network/blob/main/docs/THREE-CODEBASE-ALIGNMENT.md#21-qa-registry-rpc-boing_getqaregistry--two-different-surfaces)**.

### What operators should do

1. **Build** `boing-node` from the [Boing Network repo](https://github.com/chiku524/boing.network) `main` (or a tagged release that includes `boing_getQaRegistry`).
2. **Publish** a new GitHub Release with platform zips (same layout as today: `boing-node-windows-x86_64.exe` at zip root, etc.).
3. **Point VibeMiner** at the new zip:
   - **Network listing:** update **Node download URL** (and optional SHA256) for each preset; or  
   - **Defaults in code:** bump `BOING_TESTNET_DEFAULT_DOWNLOAD_TAG` and matching URLs in `packages/shared/src/boing-testnet-node.ts` and `packages/shared/src/networks.ts`, then redeploy the VibeMiner web/API.

4. **Users:** stop the node in VibeMiner, start again (or clear the cached binary under the app’s `nodes/` cache if the same URL was reused without a version bump—see below).

### Cache / same URL

VibeMiner caches extracts under `%APPDATA%` (or platform equivalent) keyed by **download URL** and **desktop app version** (from **1.0.89** onward). Upgrading VibeMiner therefore forces a **fresh node zip download** even when the Boing release URL is unchanged. If you still see stale RPC behavior on an older app build, change the listing **Node download URL** (new Boing tag) or delete the app’s `nodes/` cache for that network. Prefer **a new Boing release tag** per binary (current default in VibeMiner: `testnet-v0.1.6`) when you publish updated `boing-node` zips so URLs change for everyone.

### D1 listed an older testnet tag while static defaults say `v0.1.6`

The **networks API** merges D1 rows over static `boing-devnet`. A registered listing with an old download URL **wins** and the desktop app downloads that zip. **`patchBlockchainNetworkJsonForBoing`** (VibeMiner API) and **`functions/api/networks.js`** (boing.network) rewrite official **`chiku524/boing.network`** URLs from **`testnet-v0.1.0`–`testnet-v0.1.5`** to **`testnet-v0.1.6`** and refresh zip SHA256. Run **`d1/migrations/005_boing_testnet_zip_urls_v0_1_6.sql`** on **vibeminer-db** and **`website/migrations/2026-04-02-network-listings-boing-testnet-v0-1-6.sql`** on **boing-network-db** so the database matches production.

### Live overlay from Boing (`GET https://boing.network/api/networks`)

After VibeMiner merges D1 + static and runs **`patchBlockchainNetworkJsonForBoing`**, **`apps/web/src/app/api/networks/route.ts`** calls **`fetchBoingOfficialNetworks`** ( **`packages/shared/src/boing-official-api.ts`** ) and **`mergeBoingDevnetFromOfficialApi`** so **`boing-devnet`** presets pick up Boing’s **`node_download_url`**, **`node_command_template`**, and **`node_binary_sha256`** per OS when Boing has deployed a newer tag than this repo’s constants. Cached ~5 minutes per server instance; if the fetch fails, static **`boing-testnet-node.ts`** values apply. Boing’s contract and maintainer checklist: [VIBEMINER-INTEGRATION.md](https://github.com/chiku524/boing.network/blob/main/docs/VIBEMINER-INTEGRATION.md) §3.1 / §6.

## Maintainer checklist when Boing adds RPC methods

| Step | Action |
|------|--------|
| 1 | Tag Boing release (`testnet-v0.1.x`) — CI attaches `release-*-x86_64.zip`; **`testnet*`** tags publish as **non-draft** so `/releases/download/` works immediately. |
| 2 | Update [BOING_REGISTRATION_CHECKLIST.md](./BOING_REGISTRATION_CHECKLIST.md) URLs/tag. |
| 3 | Bump `BOING_TESTNET_DEFAULT_DOWNLOAD_TAG` and the matching URLs in `boing-testnet-node.ts` (Windows/Linux/macOS); static `boing-devnet` in `networks.ts` uses those constants, **`BOING_TESTNET_BOOTNODES_CLI`** (aligned with `website/src/config/testnet.ts`), and **six** `nodePresets` (full node + validator per OS). |
| 3b | **Before a new zip exists:** desktop operators can set **`VIBEMINER_BOING_NODE_EXE`** to an absolute path to a locally built `boing-node` so VibeMiner skips the GitHub download for Boing networks; see [NODE_RUNNING.md](./NODE_RUNNING.md) § Boing local binary. |
| 4 | Document in Boing [RPC-API-SPEC.md](https://github.com/chiku524/boing.network/blob/main/docs/RPC-API-SPEC.md). |

## In-app: testnet developer toolkit

The VibeMiner dashboard shows a **Testnet: tokens, contracts & NFTs** panel for Boing networks (network modal and Boing node session card): copyable **public** and **local** RPC URLs plus links to the faucet, boing.observer/qa, SDK, reference token/NFT docs, and Hub releases. Deploy and QA preflight still happen via **Boing SDK / Boing Express / Hub** against whichever RPC you choose; VibeMiner supplies the local node and documentation entry points.

## Related docs

- [NODE_RUNNING.md](./NODE_RUNNING.md) — how VibeMiner runs nodes securely.
- [BOING_REGISTRATION_CHECKLIST.md](./BOING_REGISTRATION_CHECKLIST.md) — exact Boing testnet URLs/templates for listings.
