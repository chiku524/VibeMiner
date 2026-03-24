/**
 * Creates apps/web/out so `tauri build` can bundle without a full Next static export.
 * The bundled index immediately opens the deployed web app. Tauri injects __TAURI__
 * on that origin so `desktop-bridge.js` can expose window.desktopAPI.
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../../web/out');
const appUrl =
  process.env.VIBEMINER_APP_URL || process.env.APP_URL || 'https://vibeminer.tech';

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
