# VibeMiner

A modern, seamless crypto mining experience for blockchain networks that need hashrate—**no terminal required**. Available as a **web app** and **desktop app** (Windows, macOS, Linux).

## Features

- **One-click mining** — Choose a network and start; no config files or CLI.
- **Network showcase** — Sections for each blockchain requesting the service (Monero, Raptoreum, Ergo, Kaspa, and more).
- **Easy integration** — Add new blockchains by editing `packages/shared/src/networks.ts` (or plug in your own API later).
- **Modern UI** — Dark theme, smooth animations (Framer Motion), and responsive layout.
- **Web + Desktop** — Use in the browser or install the Tauri app (Windows, macOS, Linux).

## Quick start

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

### Web app

```bash
# From repo root
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Auth: user and network accounts

Sign-in and registration use **Cloudflare D1** (database) and **KV** (sessions). Two account types:

- **Miner (user)** — Personal account to mine and track hashrate; access the miner dashboard.
- **Network** — For blockchains that want to request mining service; access the network dashboard and get listed.

**Setup:** See [`docs/CLOUDFLARE_SETUP.md`](docs/CLOUDFLARE_SETUP.md) for creating D1, KV, and R2. Auth requires these bindings; use `npm run preview` (from `apps/web`) to test auth locally. For **Vercel** deployment (monorepo), see [`docs/VERCEL.md`](docs/VERCEL.md).

### Desktop app (Tauri)

```bash
npm install
npm run desktop
```

This starts the Next.js app and opens it in a Tauri window (dev loads `http://localhost:3000`). Production installers are built with:

```bash
npm run desktop:build
```

Release builds embed a short `web/out` page that opens the deployed site (default `https://vibeminer.tech`). Override with **`VIBEMINER_APP_URL`** or **`APP_URL`** when running the Tauri build.

**Releasing installers:** Push a version tag (e.g. `v1.0.0`) to trigger [`.github/workflows/release-desktop.yml`](.github/workflows/release-desktop.yml). The workflow builds Windows, macOS, and Linux bundles and creates a [GitHub Release](https://github.com/chiku524/VibeMiner/releases). See **[`docs/TRUST_AND_NEXT_STEPS.md`](docs/TRUST_AND_NEXT_STEPS.md)** and [`docs/DESKTOP_APP.md`](docs/DESKTOP_APP.md) for env vars, signing, and distribution.

## Project structure

```
vibeminer/
├── apps/
│   ├── web/          # Next.js app (shared by web + desktop shell)
│   └── tauri/        # Tauri 2 desktop wrapper + Rust commands
├── packages/
│   └── shared/       # Types + blockchain network config
├── package.json      # Workspace root
└── README.md
```

## Adding a blockchain network

Networks are split into **mainnet** (production, real rewards) and **devnet** (testing, no real value). Every entry is validated at load time so invalid data never reaches the UI.

1. Open `packages/shared/src/networks.ts`.
2. Add an object to **`MAINNET_NETWORKS_RAW`** or **`DEVNET_NETWORKS_RAW`** with:
   - **Required:** `id`, `name`, `symbol`, `description`, `icon`, `algorithm`, `environment` (`'mainnet'` or `'devnet'`), `status` (`'live'` | `'coming-soon'` | `'requested'`)
   - **Optional:** `poolUrl`, `poolPort`, `website`, `rewardRate`, `minPayout`, `requestedBy`
3. Ensure `id` is unique and matches `^[a-z0-9][a-z0-9-]*[a-z0-9]$` (lowercase, hyphens OK).
4. Rebuild/restart. The new network appears in the correct section (Mainnet or Devnet) and, if `status === 'live'`, in the dashboard.

**Full contract:** See `packages/shared/INTEGRATION.md` for field rules, limits, and examples. Use `parseNetwork(raw)` or `registerNetwork(raw)` when adding networks programmatically (e.g. from an API).

## Mining in production

Networks include **pool URLs and ports** for real mining. The Tauri desktop app orchestrates XMRig (Monero, Raptoreum) from Rust. See [docs/MINING_INTEGRATION.md](./docs/MINING_INTEGRATION.md). The UI uses simulated hashrate until real mining runs in the desktop shell. To connect real mining:

1. **Pool integration** — Use each network’s pool API (e.g. Stratum, HTTP) to fetch live hashrate and balance.
2. **Miner binary** — On desktop, the Tauri side downloads/runs the miner (e.g. XMRig) and exposes stats via `window.desktopAPI`.
3. **Web** — Browser-based mining is limited; for real hashrate use the desktop app with a local miner.

## Tech stack

- **Web**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, TypeScript
- **Backend**: Cloudflare Workers (OpenNext), D1, KV, R2
- **Desktop**: Tauri 2 (Rust + system webview)
- **Shared**: `@vibeminer/shared` (network config + types)

## License

MIT
