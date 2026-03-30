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

VibeMiner caches extracts under `%APPDATA%` (or platform equivalent) keyed partly by **download URL**. If you **replace** a zip at the **same** URL without changing the filename, some installs may keep an old extract until you change the URL or clear cache. Prefer **a new release tag** per binary (current default in VibeMiner: `testnet-v0.1.3`) so the URL changes and everyone re-downloads.

## Maintainer checklist when Boing adds RPC methods

| Step | Action |
|------|--------|
| 1 | Tag Boing release (`testnet-v0.1.3`) — CI attaches `release-*-x86_64.zip` to a **draft** Release; publish when ready. |
| 2 | Update [BOING_REGISTRATION_CHECKLIST.md](./BOING_REGISTRATION_CHECKLIST.md) URLs/tag. |
| 3 | Bump `BOING_TESTNET_DEFAULT_DOWNLOAD_TAG` and the matching URLs in `boing-testnet-node.ts` (Windows/Linux/macOS); static `boing-devnet` in `networks.ts` uses those constants and `nodePresets` per OS. |
| 4 | Document in Boing [RPC-API-SPEC.md](https://github.com/chiku524/boing.network/blob/main/docs/RPC-API-SPEC.md). |

## Related docs

- [NODE_RUNNING.md](./NODE_RUNNING.md) — how VibeMiner runs nodes securely.
- [BOING_REGISTRATION_CHECKLIST.md](./BOING_REGISTRATION_CHECKLIST.md) — exact Boing testnet URLs/templates for listings.
