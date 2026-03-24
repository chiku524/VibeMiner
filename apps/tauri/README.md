# VibeMiner Desktop (Tauri 2)

This is the Tauri 2-based desktop app for VibeMiner. In **dev** it loads `http://localhost:3000`. In **release** builds it opens the deployed web URL by default (see Production build).

## Prerequisites

- [Rust](https://rustup.rs/)
- Node 18+
- For dev: the web app must be running on port 3000

## Development

1. From repo root, start the web app:
   ```bash
   npm run dev -w vibeminer-web
   ```
2. In another terminal, from repo root:
   ```bash
   npm run desktop
   ```
   Or from this directory: `npm run dev`

This opens the Tauri window loading `http://localhost:3000`. The web app loads `/desktop-bridge.js`, which sets `window.desktopAPI` when `__TAURI__` exists, so the same UI (including the desktop sidebar) works.

## Icons

Regenerate tray / OS icons from the splash-style source SVG:

```bash
cd apps/tauri && npx @tauri-apps/cli icon icon-source/splash-app-icon.svg
```

Or use any square PNG (e.g. 1024×1024) with the same command.

## Production build

`tauri build` runs `scripts/prepare-frontend-dist.cjs`, which writes `apps/web/out/index.html` that redirects to the live app. Set **`VIBEMINER_APP_URL`** or **`APP_URL`** when building to override the default `https://vibeminer.tech`.

To ship a fully offline Next.js export instead, point `frontendDist` at that folder and adjust `beforeBuildCommand` (see [Tauri + Next.js](https://v2.tauri.app/start/frontend/nextjs/)).

## Commands implemented

- App: version, platform, reload, open external
- Settings: get/set auto-update (persisted under app data)
- Updates: GitHub latest check (install flow partially stubbed)
- Mining / node: Rust-backed commands (see `src-tauri/src/mining.rs`, `node.rs`)
