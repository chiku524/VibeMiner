# VibeMiner Desktop (Tauri 2)

This is the Tauri 2-based desktop app for VibeMiner. It loads the same web app as the Electron build (dev: `http://localhost:3000`, production: static export or URL).

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
   npm run desktop:tauri
   ```
   Or from this directory: `npm run dev`

This opens the Tauri window loading `http://localhost:3000`. The web app detects Tauri via `/tauri-bridge.js` and sets `window.electronAPI`, so the same UI (including the desktop sidebar) works.

## Icons

Before first build, generate icons:

```bash
cd apps/tauri && npm run tauri icon path/to/1024x1024.png
```

You can use the same icon as the Electron app (e.g. from `apps/desktop/build/` if you have one).

## Production build

Production build currently requires a static export of the web app (see [Tauri + Next.js](https://v2.tauri.app/start/frontend/nextjs/)). Set `frontendDist` in `src-tauri/tauri.conf.json` to the exported output (e.g. `../../web/out` after `next build` with `output: 'export'`).

Mining and node-running commands are stubbed in this Tauri build; full implementation would port the Electron mining-service and node-service logic to Rust (or call them as sidecars). Use the Electron desktop app for full mining/node support until then.

## Commands implemented

- App: version, platform, reload, open external
- Settings: get/set auto-update (in-memory; persist can be added)
- Updates: check/get info (stubs)
- Mining/Node: stubs that return “not implemented” so the UI doesn’t crash
