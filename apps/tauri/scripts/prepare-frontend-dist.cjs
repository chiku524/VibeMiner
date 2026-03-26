/**
 * Creates apps/web/out so `tauri build` can bundle without a full Next static export.
 * The stub index redirects to the deployed web app (default https://vibeminer.tech).
 *
 * Release installers load splash/main from **absolute HTTPS URLs** on that app — not from `out/`
 * (which only contains index.html). Relative paths like `/desktop/splash` would resolve against
 * the local asset root and never hit the live Next app, so intro + windowed flow break.
 *
 * Writes `src-tauri/tauri.bundle-urls.json` merged at build time: `tauri build -c ...`
 * Override origin: VIBEMINER_APP_URL or APP_URL (same as the redirect target).
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../../web/out');
const appUrl =
  process.env.VIBEMINER_APP_URL || process.env.APP_URL || 'https://vibeminer.tech';

const origin = new URL(appUrl).origin;

fs.mkdirSync(outDir, { recursive: true });
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VibeMiner</title>
  <meta http-equiv="refresh" content="0;url=${appUrl.replace(/"/g, '')}" />
  <script>location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body style="margin:0;background:#0c0e12;color:#9ca3af;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">Loading…</body>
</html>
`;
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const bundleMergePath = path.join(__dirname, '../src-tauri/tauri.bundle-urls.json');

function absolutizeWindowUrl(url) {
  if (typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return trimmed;
}

const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const windows = (tauriConf.app && tauriConf.app.windows ? tauriConf.app.windows : []).map(
  (w) => ({
    ...w,
    url: absolutizeWindowUrl(w.url),
  })
);

const bundleMerge = {
  $schema: 'https://schema.tauri.app/config/2',
  app: {
    windows,
  },
};

fs.writeFileSync(bundleMergePath, `${JSON.stringify(bundleMerge, null, 2)}\n`, 'utf8');

console.log(
  `[prepare-frontend-dist] out/index.html → ${appUrl}\n[prepare-frontend-dist] window URLs → ${bundleMergePath} (origin ${origin})`
);
