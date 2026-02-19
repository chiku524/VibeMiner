# VibeMiner desktop app — next steps, distribution & marketplaces

This doc covers next steps for the Electron desktop app, making it installable from the web landing page, and options for app store / marketplace distribution.

---

## 1. Creating a release (GitHub Actions)

Releases are built and published automatically when you **push a version tag** to the repo.

### Steps to publish a new desktop release

1. **Create and push a tag** (format `v*`, e.g. `v1.0.0`):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Wait for the workflow** (`.github/workflows/release-desktop.yml`):
   - Builds Windows (NSIS), macOS (dmg), and Linux (AppImage) on GitHub’s runners.
   - Sets the desktop app version from the tag (e.g. `v1.0.0` → `1.0.0`).
   - Creates a **GitHub Release** for that tag and attaches the three installers.

3. **Point the web app at the release**: In Vercel (or your host), set:
   - `NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN` = `https://github.com/YOUR_ORG/crypto-miner/releases/download/v1.0.0/VibeMiner%20Setup%201.0.0.exe`
   - `NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC` = `https://github.com/YOUR_ORG/crypto-miner/releases/download/v1.0.0/VibeMiner-1.0.0.dmg`
   - `NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX` = `https://github.com/YOUR_ORG/crypto-miner/releases/download/v1.0.0/VibeMiner-1.0.0.AppImage`
   Replace `YOUR_ORG` and the version/tag with your repo and release (e.g. use `v1.0.0` for a fixed release, or update env when you cut a new release).

The `/download` page will then offer the correct installer per platform (and suggest the one for the user’s OS).

### Auto-updates

The desktop app uses **electron-updater** and checks GitHub Releases for new versions. When you push a new tag (e.g. `v1.0.2`), the release workflow builds installers and uploads them plus the update metadata (`latest.yml`, etc.) to the release.

**When updates run (installed app only):**

- **On every app startup** — the app checks for a newer version.
- **Every 4 hours** — while the app is open, it checks again.
- **Install happens when you quit** — if an update was found and downloaded, it is applied when you close the app. The next time you open the app, you’re on the new version.

So if you still see old behavior (e.g. dev tools, blank screen): **fully quit the app and open it again**. If an update was already downloaded, that reopen will be the new version. You can also use **Dashboard → Desktop app settings → “Check for updates”** to trigger a check and see “Update available — quit and reopen the app to install” or “You’re up to date”.

**Why don’t I see an update?** Auto-update only finds a new version when a **GitHub Release** exists for a **higher** version than the one you have (e.g. the repo has `v1.0.1` and you have `1.0.0`). The release must include the built installers and update metadata (`latest.yml`, etc.) — which the **release-desktop** workflow creates when you push a version tag. If you haven’t published a release yet, or the latest release is still the same version you installed, the app will report “You’re up to date”. To ship an update: bump the version (e.g. in `apps/desktop/package.json`), push a tag like `v1.0.1`, and let the workflow run; then installed clients will see the update on next check.

**Important:** Auto-update only runs for the **installed** app (the .exe / .dmg / AppImage you downloaded from Releases). If you run the app from source (`npm run dev` or `electron .`), you are not running the installed build — you’ll see dev tools and localhost, and no auto-update. To get the fixed behaviour (no dev tools, no blank screen), run the installer from the [Releases](https://github.com/chiku524/VibeMiner/releases) page.

---

## 2. Trust & security: code signing and notarization

Unsigned installers work but can trigger “unknown publisher” (Windows) or “unidentified developer” (macOS) warnings. For a **trustworthy install**, add signing and notarization and the required secrets.

### Windows (code signing)

To remove **“Unknown publisher”** and the SmartScreen warning, sign the Windows installer with a code signing certificate. The workflow is already set up: add two GitHub secrets and the next release will produce a signed `.exe`.

**Full step-by-step:** See **[`docs/WINDOWS_CODE_SIGNING.md`](WINDOWS_CODE_SIGNING.md)** for:

- Why the warning appears and what EV vs OV certificates do
- Where to buy a cert (DigiCert, Sectigo, SSL.com, etc.)
- How to export to `.pfx`, base64-encode it, and add **WIN_CODE_SIGNING_CERT_BASE64** and **WIN_CODE_SIGNING_PASSWORD** as repo secrets

After the secrets are set, the release workflow decodes the cert and signs the Windows build automatically. `signAndEditExecutable` is already enabled in `apps/desktop/package.json`.

### macOS (notarization)

1. **Apple Developer account** and an **App-specific password** for notarization.
2. In the repo: **Settings → Secrets and variables → Actions**, add:
   - `APPLE_ID`: your Apple ID email.
   - `APPLE_APP_SPECIFIC_PASSWORD`: app-specific password (create at appleid.apple.com).
   - `APPLE_TEAM_ID`: your Team ID (from developer.apple.com).
3. In `.github/workflows/release-desktop.yml`, uncomment the `APPLE_*` env vars in the **Build macOS installer** step.
4. Add **notarization** via electron-builder: install `@electron/notarize` and add an `afterSign` hook in `apps/desktop` that runs notarize (see [electron-builder macOS notarization](https://www.electron.build/code-signing#macos-notarization)). The desktop `package.json` already has `hardenedRuntime: true` and `gatekeeperAssess: false` so the app is ready for notarization.

After you add the secrets and uncomment the workflow env vars, the next release build will produce signed (Windows) and notarized (macOS) installers.

### Linux

AppImages are typically distributed without code signing. You can optionally GPG-sign the release assets and document the public key for verification.

---

## 3. Next steps for the desktop application (manual build)

### Build & host installers

1. **Build per platform** (from repo root or `apps/desktop`):
   ```bash
   cd apps/desktop && npm run build
   ```
   Outputs go to `apps/desktop/dist/`:
   - **Windows**: NSIS installer (e.g. `VibeMiner Setup 1.0.0.exe`)
   - **macOS**: `.dmg`
   - **Linux**: `.AppImage`

2. **Host the installers** so the web app can link to them. Options:
   - **GitHub Releases** (recommended for OSS): Create a release, upload the three artifacts, then set the download URLs in your web app env (see below).
   - **Cloudflare R2** (or S3): Upload build artifacts to a bucket and use public or signed URLs.
   - **Your own CDN / static host**: Serve the files and set the same env vars.

3. **Configure the landing page**: Set these in your web app environment (e.g. Cloudflare Pages env or `.env`):
   ```env
   NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN=https://github.com/your-org/crypto-miner/releases/download/v1.0.0/VibeMiner%20Setup%201.0.0.exe
   NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC=https://github.com/your-org/crypto-miner/releases/download/v1.0.0/VibeMiner-1.0.0.dmg
   NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX=https://github.com/your-org/crypto-miner/releases/download/v1.0.0/VibeMiner-1.0.0.AppImage
   ```
   The `/download` page will then show the correct buttons; it also detects the user’s OS and highlights the matching download.

### Code signing (strongly recommended)

- **Windows**: Sign the `.exe` with a code signing certificate (e.g. from DigiCert, Sectigo). Without it, SmartScreen may warn users. Use `electron-builder`’s `signAndEditExecutable` and certificate config.
- **macOS**: Sign and notarize the app with an Apple Developer account so it opens without “unidentified developer” warnings. electron-builder supports `afterSign` hooks (e.g. notarize with `@electron/notarize`).

### Auto-updates

- Add **electron-updater** and point it at your release source (e.g. GitHub Releases or a custom server). Configure in the Electron main process and optionally expose an “Check for updates” action in the UI.

### Production mining (optional)

- The app currently loads the web dashboard. For real hashrate you can later bundle or download a miner binary (e.g. xmrig) and orchestrate it from the main process, with the UI showing live stats from the miner or pool API.

---

## 4. Installable via the landing page

Yes. This is already wired up:

- **`/download` page**: Lists Windows, macOS, and Linux. Uses `NEXT_PUBLIC_DESKTOP_DOWNLOAD_*` to show download buttons; if none are set, it shows a “coming soon” style message and a link to the web dashboard.
- **Nav**: “Download” link in the header.
- **Hero**: “Download desktop” button next to “Start mining” and “View networks”.
- **Footer**: “Download” link.

Once you build the installers and set the three env vars, the landing page will offer the correct installer per platform (and suggest the one for the user’s OS).

---

## 5. Marketplaces and distribution

### Windows

| Option | Notes |
|--------|--------|
| **Microsoft Store** | Requires a developer account (~$19 one-time). Package as MSIX or use the Desktop Bridge. Good for discoverability and trust. |
| **winget** | You can publish a package so users can run `winget install YourOrg.VibeMiner`. Requires a manifest and a publicly accessible installer URL (e.g. GitHub Releases). [winget-pkgs](https://github.com/microsoft/winget-pkgs) is the repo for community packages. |

### macOS

| Option | Notes |
|--------|--------|
| **Mac App Store** | Requires Apple Developer Program ($99/year). Needs to follow App Store guidelines (sandboxing, etc.). |
| **Direct download** | Most Electron apps ship a signed/notarized `.dmg` from their website (or `/download`). No store fee; users download from your site. |

### Linux

| Option | Notes |
|--------|--------|
| **Snap Store** | You can wrap the AppImage (or build a snap) and publish to the Snap Store. |
| **Flathub** | Publish a Flatpak; Flathub is the main store. Requires a manifest and build process. |
| **AppImage (direct)** | Your current build already produces an AppImage. Host it (e.g. GitHub Releases) and link from `/download`—no store required. |

### Summary

- **Fast path**: Use the **landing page `/download`** with installers hosted on **GitHub Releases** (or R2). Add **code signing** on Windows and **notarization** on macOS when you’re ready.
- **Stores**: Add **winget** for Windows (free, good for power users), and consider **Microsoft Store** and **Mac App Store** later for broader reach and trust.

---

## 6. Quick reference

- **Release from tag**: Push a tag `v*` (e.g. `v1.0.0`) → workflow builds and creates a GitHub Release with installers.
- **Desktop build (local)**: `cd apps/desktop && npm run build` → `dist/`
- **Web download page**: `/download`; env vars `NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN`, `_MAC`, `_LINUX`
- **Docs**: Auth/setup → `docs/CLOUDFLARE_SETUP.md`; branding/SEO → `docs/SEO_AND_BRANDING.md`
