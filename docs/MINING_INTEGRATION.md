# Real Mining Integration

This document describes how real mining is integrated and how to enable it.

## Current State

- **Networks** — Static networks (Monero, Kaspa, Ergo, Raptoreum) and devnets now include `poolUrl` and `poolPort` so miners can connect to real pools.
- **Network registration** — The Request Listing form requires pool URL/port. Dynamically registered networks from `/api/networks/register` are served alongside static networks.
- **Mining (desktop)** — The Tauri app implements mining in Rust (`apps/tauri/src-tauri/src/mining.rs`), including downloading and running XMRig where applicable.
- **IPC** — The web UI calls `startRealMining`, `stopRealMining`, `getRealMiningStats`, `isRealMining` via `window.desktopAPI` (Tauri `invoke` from `desktop-bridge.js`).

## Enabling Real Mining

### 1. No separate install needed

XMRig is **bundled** with the VibeMiner Desktop installer. When you download the app from the website, it already includes the miner. Mining works immediately after install—no first-run download.

If the bundled miner is missing (e.g. in dev mode), the app auto-downloads it on first mining attempt as a fallback.

### 2. Wallet Address

Real mining requires a wallet address for payouts. The MiningPanel has a payout address input. When the UI is wired to real mining, this value will be passed to `startRealMining`.

### 3. Pool Connection

Networks with `poolUrl` and `poolPort` are mineable. The mining service builds the XMRig command:

```
xmrig --url pool.example.com:3333 -u YOUR_WALLET --donate-level 0 ...
```

For Ghostrider (Raptoreum): `xmrig -a ghostrider --url ... -u ...`

## Network Pool Configuration

| Network   | Pool URL            | Port | Algorithm   | Miner   |
|----------|----------------------|------|-------------|---------|
| Monero   | pool.supportxmr.com  | 3333 | RandomX     | xmrig   |
| Raptoreum| rtm.pukkapool.com    | 3052 | Ghostrider  | xmrig   |
| Kaspa    | kas.2miners.com      | 2020 | kHeavyHash  | kaspaminer* |
| Ergo     | erg.2miners.com      | 8888 | Autolykos2  | lolminer* |

\* Kaspa and Ergo require lolminer or kaspaminer; support can be added to the mining service.

## Network Registration

Networks can self-register via the **Request listing** form at `/dashboard/network` (network accounts only). Required fields:

- Network name, symbol, algorithm
- Pool URL and port (so miners can connect)
- Description (min. 20 characters)

Devnet listings are free; mainnet requires the listing fee. See [NETWORK_ONBOARDING.md](./NETWORK_ONBOARDING.md).

## Algorithm Mapping

The shared package exports `getMinerTypeForNetwork(network)` and `isNetworkMineable(network)`. Use these in the UI to show "Real mining available" or "Simulated" badges.

## Next Steps for Full Integration

1. **UI wiring** — When the user starts mining on desktop with a wallet address, call `window.desktopAPI.startRealMining({ network, walletAddress })` instead of (or in addition to) simulated session.
2. **Stats polling** — Poll `getRealMiningStats` every 2s and merge into MiningContext sessions.
3. **Wallet persistence** — Store wallet address in settings or localStorage so it persists across sessions.
4. **Kaspa/Ergo miners** — Extend mining-service.js to spawn lolminer and kaspaminer with the correct args.
