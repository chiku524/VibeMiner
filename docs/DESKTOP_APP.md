# VibeMiner desktop app (Tauri) — distribution & releases

This doc covers the **Tauri 2** desktop shell (`apps/tauri`), GitHub Releases, download links, and optional signing.

## 1. Installers and the download page

**Releases from the “Release desktop app” workflow include installers.** The workflow runs when you **push a version tag** (`v*`) or when you run it manually with a tag. It builds Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`) and attaches them to the GitHub Release. Fixed asset names (`VibeMiner-Setup-latest.exe`, `VibeMiner-latest-arm64.dmg`, `VibeMiner-latest.AppImage`, plus versioned copies) keep `/releases/latest/download/...` and the site’s download API working.

### Publish a new desktop release

1. Ensure `main` has the code you want to ship.
2. Create and push a tag, e.g. `git tag v1.0.1 && git push origin v1.0.1`.
3. Wait for [`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml). It syncs the tag into `apps/tauri/src-tauri/tauri.conf.json`, `Cargo.toml`, and `apps/tauri/package.json`, then runs `npm run build -w vibeminer-tauri`.
4. Confirm the new [GitHub Release](https://github.com/chiku524/VibeMiner/releases) lists the installers.

### App icons (taskbar, installer, shortcuts)

Icons under `apps/tauri/src-tauri/icons/` are generated from `apps/web/public/brand/logo-source.png` via `apps/web/scripts/build-brand-assets.cjs` and `tauri icon`. After changing the source artwork, run from the repo root:

```bash
npm run desktop:icons
```

That refreshes web brand PNGs (including `icon-source/app-icon-1024.png`) and regenerates all platform icons (`icon.ico`, `StoreLogo.png`, `Square*.png`, etc.).

### Production web URL

Release builds run `apps/tauri/scripts/prepare-frontend-dist.cjs`, which creates `apps/web/out/index.html` that opens the live site (default `https://vibeminer.tech`). Override with **`VIBEMINER_APP_URL`** or **`APP_URL`** when building.

Because the **main window loads that HTTPS origin**, Tauri 2 treats it as a **remote** webview. `core:default` alone does **not** expose custom `invoke` commands (`start_node`, mining, etc.). Those are granted by **`permissions/allow-vibeminer-ipc.json`** and referenced from **`capabilities/default.json`** alongside the `remote.urls` allowlist.

### Updates in the app

The UI uses **`window.desktopAPI`**, set by [`apps/web/public/desktop-bridge.js`](../apps/web/public/desktop-bridge.js) when Tauri’s `__TAURI__` runtime is present. The Tauri **updater** plugin is configured in `apps/tauri/src-tauri/tauri.conf.json` (`plugins.updater`).

**Tauri 2 `invoke` shapes:** Commands whose Rust handler takes a struct as a parameter named `opts` (e.g. `start_node`, `start_real_mining` in `lib.rs`) require the webview to call `invoke(cmd, { opts: { … } })`, not a flat object. The bridge wraps those payloads so remote and localhost UIs stay in sync with the binary.

**CI signing (`TAURI_SIGNING_PRIVATE_KEY`):** GitHub Actions must receive the **entire** minisign secret key file as the secret value: the first line (`untrusted comment: …`) **and** the second line (base64). Pasting only the second line causes `Missing comment in secret key`. Generate a keypair with `npx @tauri-apps/cli signer generate -w path/to/key --ci`, put the matching **public** line in `tauri.conf.json` `pubkey`, store the **private** file contents in the repo secret, and ensure **`TAURI_SIGNING_PRIVATE_KEY`** is set in [`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml) (release jobs pass it into `npm run build`). Without `.sig` files next to the NSIS/AppImage/app.tar.gz bundles, **`latest.json` is not generated** and `https://github.com/chiku524/VibeMiner/releases/latest/download/latest.json` returns **404** — the app will not see updates.

**`latest.json` contents:** [`.github/scripts/generate-updater-latest.mjs`](../.github/scripts/generate-updater-latest.mjs) writes one entry per **signed** platform (Windows, Linux, macOS arm64, etc.). Partial manifests are valid: e.g. Windows-only signing still enables updates on Windows. After a release finishes, confirm the file exists at the URL above (or `.../download/vX.Y.Z/latest.json` for that tag).

---

## 2. Code signing & trust (optional)

### Windows

Unsigned Windows builds may show SmartScreen warnings. Tauri bundles can be signed with your certificate; see [Tauri — Windows code signing](https://v2.tauri.app/distribute/sign-windows/) and [`docs/WINDOWS_CODE_SIGNING.md`](./WINDOWS_CODE_SIGNING.md) (see `apps/tauri` for bundle settings).

### macOS

For distribution outside the App Store, sign and notarize the app; see [Tauri — macOS code signing](https://v2.tauri.app/distribute/sign-macos/). The release workflow forwards `APPLE_*` secrets if you add notarization steps later.

---

## 3. Local build

From repo root (Rust toolchain required):

```bash
npm install
npm run desktop:build
```

Artifacts are under `apps/tauri/src-tauri/target/release/bundle/` (per platform).

Dev shell (web on :3000 + Tauri):

```bash
npm run desktop
```

---

## 4. Landing page & marketplaces

- **Download page** (`/download`) uses `/api/desktop-downloads` → GitHub API / `releases/latest/download` URLs.
- **Stores** (Microsoft Store, Mac App Store, etc.) need separate packaging; Tauri supports various targets—see [Tauri distribution](https://v2.tauri.app/distribute/).

---

## 5. Checklist

| Item | Notes |
|------|--------|
| **Tag push** | Triggers release workflow |
| **Version** | Taken from tag; written into Tauri `package.json` / `tauri.conf.json` / `Cargo.toml` |
| **Download links** | Rely on fixed asset names produced by the workflow’s rename step |
| **Local build** | `npm run desktop:build` |
