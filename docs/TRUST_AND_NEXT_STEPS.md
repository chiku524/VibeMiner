# Trust & next steps — nico.builds

This doc summarizes what’s already set for **trust** (publisher/author as nico.builds), what would make installs even more trustworthy, and the **exact steps** to get the download page working (including Vercel env vars).

---

## What’s already set for trust (no license required)

These are in place so your brand **nico.builds** shows up consistently:

| Where | What shows |
|--------|------------|
| **Windows installer** | **Publisher:** nico.builds (in Add/Remove Programs and installer metadata). Without code signing, SmartScreen may still say “Unknown publisher” until you add a cert. |
| **macOS app** | **Author:** nico.builds (in Get Info / app metadata). Gatekeeper may still say “unidentified developer” until the app is notarized. |
| **App bundle ID** | `com.nicobuilds.vibeminer` so the installed app is clearly tied to nico.builds. |
| **Web** | Footer and download page credit “VibeMiner by nico.builds” and link to nico.builds. |
| **GitHub Release** | Release body says “Built and published by nico.builds” and “publisher: nico.builds” for Windows. |

No company or license is required for this. Your portfolio and professional work are enough for the **publisher/author name** to be consistent everywhere.

---

## What would make it even more trustworthy (optional)

| Goal | What you’d need | Effect |
|------|------------------|--------|
| **Windows: no “Unknown publisher”** | A **code signing certificate** (e.g. DigiCert, Sectigo). You can get one as an individual; some issuers ask for identity/business details. | SmartScreen shows your name (e.g. “nico.builds” or the cert subject) instead of “Unknown publisher.” |
| **macOS: no “unidentified developer”** | **Apple Developer account** ($99/year) + **signing + notarization** for the Tauri bundle (see [Tauri macOS signing](https://v2.tauri.app/distribute/sign-macos/)). | Gatekeeper allows the app to open without right‑click → Open. |
| **Linux** | Optional: GPG-sign the release assets and publish your public key. | Users can verify the download. |

### Apple notarization (optional; extend the workflow)

The release workflow forwards `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` to the macOS build job so you can add **notarization** steps later. Tauri does not notarize by default—you configure signing/notarization per [Tauri macOS docs](https://v2.tauri.app/distribute/sign-macos/) and wire the secrets into those steps.

---

## Information that helps (for later, if you want)

- **For Windows code signing** (when you get a cert): legal name or DBA for the cert (e.g. “nico.builds”), and an email for the cert.
- **For Apple notarization:** the workflow already uses it; add the three secrets above (Apple ID, app-specific password, Team ID) when you’re ready.

---

## Next steps (in order)

You said you haven’t added any env vars to Vercel yet. Do this sequence:

### 1. Commit and push the latest changes

Make sure the repo has:

- The nico.builds branding (Footer, download page, Tauri `identifier` / bundle metadata in `apps/tauri/src-tauri/tauri.conf.json`).
- The release workflow (`.github/workflows/release-desktop.yml`).

Then push to your default branch (e.g. `main`).

### 2. (Optional) Apple signing / notarization

Add `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` when you implement macOS signing in the workflow. Until then, the macOS job still produces a `.dmg`; Gatekeeper may prompt users until the app is signed and notarized.

### 3. Create the first desktop release

From your repo root:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the workflow. Wait for it to finish (Actions tab on GitHub). The workflow will create a **GitHub Release** for `v1.0.0` and attach three installers (Windows `.exe`, macOS `.dmg`, Linux `.AppImage`).

### 4. Copy the installer URLs from the release

1. Open: `https://github.com/chiku524/crypto-miner/releases`
2. Open the release **v1.0.0** (or whatever tag you used).
3. Right‑click each installer link → “Copy link address.” You’ll get URLs like:
   - Windows: `https://github.com/chiku524/crypto-miner/releases/download/v1.0.0/VibeMiner%20Setup%201.0.0.exe`
   - macOS: `https://github.com/chiku524/crypto-miner/releases/download/v1.0.0/VibeMiner-1.0.0.dmg`
   - Linux: `https://github.com/chiku524/crypto-miner/releases/download/v1.0.0/VibeMiner-1.0.0.AppImage`

(Exact filenames depend on the version; the release page shows the real names.)

### 5. Add env vars in Vercel

1. Vercel dashboard → your project (crypto-miner web app).
2. **Settings** → **Environment Variables**.
3. Add these three (for Production, and optionally Preview if you want):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_DESKTOP_DOWNLOAD_WIN` | The Windows installer URL you copied (e.g. `https://github.com/.../VibeMiner%20Setup%201.0.0.exe`) |
| `NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC` | The macOS installer URL you copied |
| `NEXT_PUBLIC_DESKTOP_DOWNLOAD_LINUX` | The Linux installer URL you copied |

4. Save. Trigger a new deployment (e.g. **Deployments** → … on latest → **Redeploy**) so the build picks up the new env vars.

### 6. Verify the download page

Open your site’s `/download` page (e.g. `https://your-site.vercel.app/download`). You should see:

- Three download buttons (Windows, macOS, Linux).
- The one for the user’s OS marked as recommended.
- The “Built and published by nico.builds” line.

Click each button and confirm the correct installer downloads from GitHub.

---

## Optional tweaks

- **Portfolio URL:** The Footer and download page link to `https://nico.builds`. If your real URL is different (e.g. `https://nicobuilds.com`), search for `nico.builds` in `apps/web/src` and replace the `href` with your URL.
- **Support email:** The Footer uses `support@vibeminer.tech`. You can change it in `apps/web/src/components/Footer.tsx` and `apps/web/src/app/fees/page.tsx` if needed.
- **Future releases:** When you cut a new version (e.g. `v1.1.0`), push the tag, wait for the workflow, then update the three Vercel env vars to the new release’s installer URLs so “Download” always points at the latest (or keep them on a fixed version if you prefer).

That’s it. Once the env vars are set and the release exists, the download process is in place and consistently branded as nico.builds.
