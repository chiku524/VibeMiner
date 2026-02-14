# Vibe Mine

A modern, seamless crypto mining experience for blockchain networks that need hashrate—**no terminal required**. Available as a **web app** and **desktop app** (Windows & macOS).

## Features

- **One-click mining** — Choose a network and start; no config files or CLI.
- **Network showcase** — Sections for each blockchain requesting the service (Monero, Raptoreum, Ergo, Kaspa, and more).
- **Easy integration** — Add new blockchains by editing `packages/shared/src/networks.ts` (or plug in your own API later).
- **Modern UI** — Dark theme, smooth animations (Framer Motion), and responsive layout.
- **Web + Desktop** — Use in the browser or install the Electron app on PC/Mac.

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

### Desktop app (Electron)

```bash
npm install
npm run desktop
```

This starts the web app and opens it in an Electron window. For a production build:

```bash
npm run build
cd apps/desktop && npm run build
```

## Project structure

```
crypto-miner/
├── apps/
│   ├── web/          # Next.js app (shared by web + desktop)
│   └── desktop/      # Electron wrapper
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

The current UI uses **simulated** hashrate and earnings for demo purposes. To connect real mining:

1. **Pool integration** — Use each network’s pool API (e.g. Stratum, HTTP) to fetch live hashrate and balance.
2. **Miner binary** — For desktop, bundle or download a miner (e.g. xmrig for Monero) and orchestrate it from the Electron main process; the UI would show real stats from the miner or pool.
3. **Web** — Browser-based mining is limited; for real hashrate you’d typically use the desktop app with a local miner.

## Tech stack

- **Web**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, TypeScript
- **Desktop**: Electron
- **Shared**: `@crypto-miner/shared` (network config + types)

## License

MIT
