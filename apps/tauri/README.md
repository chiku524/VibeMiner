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

All **Windows** surfaces (executable, taskbar, window title bar, Start menu, shortcuts, installer/MSIX tiles) use the generated set under `src-tauri/icons/`:

- **`icon.ico`** — embedded in the `.exe`; layers for 16–256px (taskbar, title bar, Alt+Tab).
- **`icon.png`** — primary app icon (also applied at runtime to the main window for consistent dev/prod).
- **`32x32.png` / `64x64.png` / `128x128.png` / `128x128@2x.png`** — listed in `bundle.icon` in `tauri.conf.json`.
- **`StoreLogo.png`**, **`Square*.png`** — Windows Store / MSIX packaging from `tauri icon`.

Nothing here is hand-edited; it is generated from **`icon-source/app-icon-1024.png`**, which is produced by the web app’s brand pipeline (`apps/web/scripts/build-brand-assets.cjs`).

**One command from repo root** (refresh web brand PNGs, then regenerate all Tauri icons):

```bash
npm run desktop:icons
```

**Or** from `apps/tauri` after updating `apps/web` assets:

```bash
npm run icons:from-web
```

The legacy `splash-app-icon.svg` is not used for icon generation.

**System tray:** this app does not register a tray icon yet. There is no separate tray asset; adding a tray would reuse the same `icons/icon.png` / `icon.ico`.

## Production build

`npm run build` (from `apps/tauri` or via `-w vibeminer-tauri`) runs **`npm run prepare-frontend`** first, then `tauri build`. That writes `apps/web/out/index.html` that redirects to the live app. Set **`VIBEMINER_APP_URL`** or **`APP_URL`** when building to override the default `https://vibeminer.tech`.

`beforeBuildCommand` is intentionally unset so CI/npm workspace builds do not depend on Tauri’s hook working-directory behavior. If you invoke **`cargo tauri build`** from `src-tauri` only, run `npm run prepare-frontend` from `apps/tauri` first (or use `npm run build`).

To ship a fully offline Next.js export instead, point `frontendDist` at that folder and wire a prepare step that copies or builds into `apps/web/out` (see [Tauri + Next.js](https://v2.tauri.app/start/frontend/nextjs/)).

## Commands implemented

- App: version, platform, reload, open external
- Settings: get/set auto-update (persisted under app data)
- Updates: GitHub latest check (install flow partially stubbed)
- Mining / node: Rust-backed commands (see `src-tauri/src/mining.rs`, `node.rs`)
