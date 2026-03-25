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

Windows (taskbar, title bar, Start menu, shortcuts) and other targets use the files under `src-tauri/icons/` — especially `icon.ico` and `icon.png`. Those are **not** hand-edited; they are generated from the source mark.

After running `npm run generate-brand-assets` in `apps/web`, `icon-source/app-icon-1024.png` is updated. Regenerate OS icons:

```bash
cd apps/tauri && npm run icons
```

This runs `tauri icon icon-source/app-icon-1024.png`. The legacy `splash-app-icon.svg` is unused for icon generation.

There is no separate system-tray icon in this app; the same bundle icon set is used for the window and OS chrome.

## Production build

`npm run build` (from `apps/tauri` or via `-w vibeminer-tauri`) runs **`npm run prepare-frontend`** first, then `tauri build`. That writes `apps/web/out/index.html` that redirects to the live app. Set **`VIBEMINER_APP_URL`** or **`APP_URL`** when building to override the default `https://vibeminer.tech`.

`beforeBuildCommand` is intentionally unset so CI/npm workspace builds do not depend on Tauri’s hook working-directory behavior. If you invoke **`cargo tauri build`** from `src-tauri` only, run `npm run prepare-frontend` from `apps/tauri` first (or use `npm run build`).

To ship a fully offline Next.js export instead, point `frontendDist` at that folder and wire a prepare step that copies or builds into `apps/web/out` (see [Tauri + Next.js](https://v2.tauri.app/start/frontend/nextjs/)).

## Commands implemented

- App: version, platform, reload, open external
- Settings: get/set auto-update (persisted under app data)
- Updates: GitHub latest check (install flow partially stubbed)
- Mining / node: Rust-backed commands (see `src-tauri/src/mining.rs`, `node.rs`)
