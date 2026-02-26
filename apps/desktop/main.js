const { app, BrowserWindow, ipcMain, shell, net, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

const GITHUB_OWNER = 'chiku524';
const GITHUB_REPO = 'VibeMiner';
const RELEASE_PAGE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

function getDirectDownloadUrl(platform) {
  const base = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download`;
  if (platform === 'win32') return `${base}/VibeMiner-Setup-latest.exe`;
  if (platform === 'darwin') return `${base}/VibeMiner-latest-arm64.dmg`;
  if (platform === 'linux') return `${base}/VibeMiner-latest.AppImage`;
  return RELEASE_PAGE_URL;
}

// Packaged app = production (no dev tools, load vibeminer.tech). Unpackaged = dev (localhost + dev tools).
const isDev = !app.isPackaged;

// Test the "update available at launch" path without publishing a release. No download or install; after showing the update window we continue to the main app.
// Usage: VIBEMINER_SIMULATE_UPDATE=1 npm run electron   or   npm run electron -- --simulate-update
const simulateUpdateAtLaunch = process.env.VIBEMINER_SIMULATE_UPDATE === '1' || process.argv.includes('--simulate-update');

// GitHub API and release asset downloads require a valid User-Agent (403 otherwise).
// Accept: application/octet-stream can help when downloading installer assets from GitHub's CDN.
function configureUpdater() {
  const version = app.getVersion();
  autoUpdater.requestHeaders = {
    'User-Agent': `VibeMiner-updater/${version} (${process.platform}; ${process.arch})`,
    Accept: 'application/vnd.github.v3+json, application/octet-stream',
  };
  autoUpdater.channel = 'latest';
}

// Simple semver comparison: returns true if a < b (e.g. "1.0.22" < "1.0.24").
function isNewerVersion(current, latest) {
  if (!latest || typeof latest !== 'string') return false;
  const cur = (current || '').replace(/^v/i, '').split('.').map(Number);
  const lat = latest.replace(/^v/i, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const c = cur[i] || 0;
    const l = lat[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

// Fallback: fetch latest release from GitHub API when electron-updater doesn't find one.
async function fetchLatestReleaseFromGitHub() {
  const version = app.getVersion();
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
  const res = await net.fetch(url, {
    headers: {
      'User-Agent': `VibeMiner-updater/${version} (${process.platform}; ${process.arch})`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const tag = data && data.tag_name;
  if (!tag || typeof tag !== 'string') return null;
  return tag.replace(/^v/i, '');
}

const SETTINGS_FILE = 'settings.json';
function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}
function loadSettings() {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf8');
    const s = JSON.parse(data);
    return { autoUpdate: s.autoUpdate !== false };
  } catch {
    return { autoUpdate: true };
  }
}
function saveSettings(settings) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

let updateCheckInterval = null;
let updateDownloaded = false;
let inAppUpdateInProgress = false;
/** When we detect a newer version (from API or updater), store so the UI can show a download link. */
let latestUpdateAvailable = null;

function notifyUpdateAvailable(latestVersion) {
  latestUpdateAvailable = {
    latestVersion,
    releasePageUrl: RELEASE_PAGE_URL,
    directDownloadUrl: getDirectDownloadUrl(process.platform),
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', latestUpdateAvailable);
  }
}

/** Send update phase to main window so the in-app overlay can show progress (no popup window).
 * When updateOnlyWindow is set (startup update flow), updates that window's DOM instead of IPC.
 * Optional second arg: suffix (e.g. " (test)" for simulated flow). */
function sendUpdateProgress(phase, messageSuffix) {
  const suffix = messageSuffix || '';
  if (updateOnlyWindow && !updateOnlyWindow.isDestroyed()) {
    const msg = (phase === 'downloading' ? 'Downloading update…' : 'Installing… The app will close in a moment.') + suffix;
    updateOnlyWindow.webContents.executeJavaScript(`(function(){ var el = document.getElementById('update-msg'); if(el) el.textContent = '${msg.replace(/'/g, "\\'")}'; })();`).catch(() => {});
    return;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-progress', { phase });
  }
}

function runUpdateCheck() {
  return autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[VibeMiner] Update check failed:', err?.message || err);
  });
}

function scheduleAutoUpdateChecks() {
  if (updateCheckInterval) clearInterval(updateCheckInterval);
  if (!loadSettings().autoUpdate) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  // Check runs on every app open (main window did-finish-load). Here we only schedule the 4-hour interval.
  updateCheckInterval = setInterval(runUpdateCheck, 4 * 60 * 60 * 1000);
}

// Run once after startup: if GitHub API shows a newer version, notify UI and optionally run in-app update flow.
function runStartupUpdateCheck() {
  if (!app.isPackaged) return;
  const currentVersion = app.getVersion();
  fetchLatestReleaseFromGitHub()
    .then((fromApi) => {
      if (fromApi && isNewerVersion(currentVersion, fromApi)) {
        console.info('[VibeMiner] Update available (startup check):', fromApi);
        notifyUpdateAvailable(fromApi);
        if (loadSettings().autoUpdate && !inAppUpdateInProgress) {
          inAppUpdateInProgress = true;
          setTimeout(() => runInAppUpdateFlow(fromApi), 800);
        }
      }
    })
    .catch((err) => console.error('[VibeMiner] Startup update check failed:', err?.message || err));
}

function setupUpdaterEvents() {
  autoUpdater.on('error', (err) => {
    console.error('[VibeMiner] Updater error:', err?.message || err);
    if (err?.stack) console.error('[VibeMiner] Updater stack:', err.stack);
  });
  autoUpdater.on('update-available', (info) => {
    const v = info?.version || 'unknown';
    const current = app.getVersion();
    if (v && v !== 'unknown' && isNewerVersion(current, v)) {
      console.info('[VibeMiner] Update available:', v);
      notifyUpdateAvailable(v);
      if (loadSettings().autoUpdate && !inAppUpdateInProgress) {
        inAppUpdateInProgress = true;
        runInAppUpdateFlow(v);
      }
    } else {
      console.info('[VibeMiner] Update event ignored (not newer): current', current, ', reported', v);
    }
  });
  autoUpdater.on('update-not-available', (info) => {
    console.info('[VibeMiner] No update (current:', app.getVersion(), ', latest:', info?.version || 'unknown', ')');
  });
  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-downloaded');
    runAutoInstallIfReady();
  });
}

const AUTO_INSTALL_DELAY_MS = 2500;

/** If auto-update is on and an update is already downloaded, show update-only window and quit-and-install (no popup). */
function runAutoInstallIfReady() {
  if (!loadSettings().autoUpdate || !updateDownloaded) return;
  // Show only the update window; hide main if it's visible
  if (mainWindow && !mainWindow.isDestroyed() && (!updateOnlyWindow || updateOnlyWindow.isDestroyed())) {
    updateOnlyWindow = createUpdateOnlyWindow(getIconPath());
    mainWindow.hide();
  }
  sendUpdateProgress('installing');
  setTimeout(() => {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (e) {
      console.error('[VibeMiner] quitAndInstall failed:', e?.message || e);
    }
  }, AUTO_INSTALL_DELAY_MS);
}

/** Run the full in-app update flow: show progress in update-only window, download installer, run it, quit. No popup window. */
async function runInAppUpdateFlow(latestVersion) {
  if (!latestVersion || !isNewerVersion(app.getVersion(), latestVersion)) return;
  // If main window is visible but update-only window isn't, create it and hide main so only the update window shows
  if (mainWindow && !mainWindow.isDestroyed() && (!updateOnlyWindow || updateOnlyWindow.isDestroyed())) {
    updateOnlyWindow = createUpdateOnlyWindow(getIconPath());
    mainWindow.hide();
  }
  notifyUpdateAvailable(latestVersion);
  sendUpdateProgress('downloading');
  const url = getDirectDownloadUrl(process.platform);
  const version = app.getVersion();
  const headers = {
    'User-Agent': `VibeMiner-updater/${version} (${process.platform}; ${process.arch})`,
    Accept: 'application/octet-stream',
  };
  const ext = path.extname(new URL(url).pathname) || (process.platform === 'win32' ? '.exe' : process.platform === 'darwin' ? '.dmg' : '');
  const tempDir = app.getPath('temp');
  const tempFile = path.join(tempDir, `VibeMiner-Update${ext}`);

  try {
    const res = await net.fetch(url, { headers });
    if (!res.ok) {
      inAppUpdateInProgress = false;
      return;
    }
    const buf = await res.arrayBuffer();
    fs.writeFileSync(tempFile, new Uint8Array(buf), { flag: 'w' });
  } catch (err) {
    console.error('[VibeMiner] Update download failed:', err?.message || err);
    inAppUpdateInProgress = false;
    return;
  }

  sendUpdateProgress('installing');
  await new Promise((r) => setTimeout(r, 2000));

  const platform = process.platform;
  const launchDelaySeconds = 8;
  const preQuitDelayMs = 4000;

  if (platform === 'win32') {
    // Use a VBS launcher so the installer runs fully detached and survives app.quit() (PowerShell/child can be torn down with the app on Windows).
    // /S = silent install, --force-run = relaunch app after install (NSIS default skips this for silent mode).
    const vbsPath = path.join(tempDir, 'VibeMiner-Update-Launcher.vbs');
    const vbsContent =
      'WScript.Sleep ' + (launchDelaySeconds * 1000) + '\n' +
      'CreateObject("WScript.Shell").Run Chr(34) & "' + tempFile.replace(/"/g, '""') + '" & Chr(34) & " /S --force-run", 0, False\n';
    fs.writeFileSync(vbsPath, vbsContent, 'utf8');
    const child = spawn('wscript.exe', ['//B', vbsPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
  } else if (platform === 'darwin') {
    const scriptPath = path.join(tempDir, 'VibeMiner-Update-Launcher.sh');
    fs.writeFileSync(scriptPath, `#!/bin/sh\nsleep ${launchDelaySeconds}\nopen "${tempFile.replace(/"/g, '\\"')}"\n`, 'utf8');
    fs.chmodSync(scriptPath, 0o755);
    const child = spawn(scriptPath, [], { detached: true, stdio: 'ignore' });
    child.unref();
  } else {
    const scriptPath = path.join(tempDir, 'VibeMiner-Update-Launcher.sh');
    fs.writeFileSync(scriptPath, `#!/bin/sh\nsleep ${launchDelaySeconds}\nchmod +x "${tempFile.replace(/"/g, '\\"')}"\nexec "${tempFile.replace(/"/g, '\\"')}"\n`, 'utf8');
    fs.chmodSync(scriptPath, 0o755);
    const child = spawn(scriptPath, [], { detached: true, stdio: 'ignore' });
    child.unref();
  }
  await new Promise((r) => setTimeout(r, preQuitDelayMs));
  app.quit();
}

/** Simulated update-at-launch flow for testing: show update-only window and progress, then continue to main app (no download/install). */
async function runSimulatedUpdateFlow(onDone) {
  sendUpdateProgress('downloading', ' (test)');
  await new Promise((r) => setTimeout(r, 2000));
  sendUpdateProgress('installing', ' (test)');
  await new Promise((r) => setTimeout(r, 2500));
  if (updateOnlyWindow && !updateOnlyWindow.isDestroyed()) {
    updateOnlyWindow.close();
    updateOnlyWindow = null;
  }
  inAppUpdateInProgress = false;
  if (typeof onDone === 'function') onDone();
}

const FAILED_LOAD_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibeMiner</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c0e12;color:#e5e7eb;font-family:system-ui,sans-serif;text-align:center;padding:1.5rem;}h1{font-size:1.25rem;margin-bottom:0.5rem;}p{color:#9ca3af;margin-bottom:1.5rem;}button{background:#22d3ee;color:#0c0e12;border:none;padding:0.75rem 1.5rem;border-radius:0.75rem;font-weight:600;cursor:pointer;}button:hover{filter:brightness(1.1);}</style></head><body><div><h1>Can&rsquo;t connect</h1><p>Check your internet connection, then try again.</p><button type="button" id="retry">Retry</button></div><script>document.getElementById("retry").onclick=function(){if(typeof window.electronAPI!=="undefined"&&window.electronAPI.reload){window.electronAPI.reload();}else{location.reload();}}</script></body></html>`;

const UPDATE_ONLY_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibeMiner Update</title><style>*{box-sizing:border-box;}body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0c0e12;color:#e5e7eb;font-family:system-ui,sans-serif;text-align:center;padding:2rem;}.sym{width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:1.75rem;background:linear-gradient(135deg,rgba(34,211,238,0.25),rgba(52,211,153,0.2));border-radius:1rem;}.name{font-size:1.25rem;font-weight:700;margin-top:0.75rem;background:linear-gradient(90deg,#22d3ee,#34d399);-webkit-background-clip:text;background-clip:text;color:transparent;}#update-msg{margin-top:1rem;font-size:0.9rem;color:#9ca3af;}.sp{width:28px;height:28px;margin-top:1rem;border:2px solid #22d3ee;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}</style></head><body><div class="sym" aria-hidden="true">◇</div><div class="name">VibeMiner</div><p id="update-msg">Preparing update…</p><div class="sp" aria-hidden="true"></div></body></html>`;

const SPLASH_MIN_MS = 1800;
const SPLASH_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibeMiner</title><style>
*{box-sizing:border-box;}body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0c0e12;color:#e5e7eb;font-family:system-ui,sans-serif;text-align:center;padding:2rem;}
.symbol{width:72px;height:72px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:linear-gradient(135deg,rgba(34,211,238,0.25),rgba(52,211,153,0.2));border-radius:1.25rem;animation:fade 0.8s ease-out;}
.name{margin-top:1rem;font-size:1.5rem;font-weight:700;background:linear-gradient(90deg,#22d3ee,#34d399);-webkit-background-clip:text;background-clip:text;color:transparent;animation:fade 0.6s ease-out 0.15s both;}
.tag{ margin-top:0.35rem;font-size:0.8rem;color:#9ca3af;animation:fade 0.5s ease-out 0.3s both;}
@keyframes fade{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
</style></head><body><div class="symbol" aria-hidden="true">◇</div><div class="name">VibeMiner</div><p class="tag">Mine without the grind.</p></body></html>`;

let mainWindow = null;
let splashWindow = null;
let updateOnlyWindow = null;
let tray = null;
let isQuitting = false;
let mainReady = false;
let splashMinElapsed = false;

/** Resolve app icon path so taskbar/window use it (packaged: prefer app.asar.unpacked/build). */
function getIconPath() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
  const candidates = [];
  if (app.isPackaged && process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'build', iconName));
    candidates.push(path.join(process.resourcesPath, 'build', iconName));
  }
  candidates.push(path.join(__dirname, 'build', iconName));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function maybeShowMainAndCloseSplash() {
  if (!mainReady || !splashMinElapsed || !mainWindow || mainWindow.isDestroyed()) return;
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  mainWindow.show();
  mainWindow.focus();
}

function createSplashWindow(iconPath) {
  const splash = new BrowserWindow({
    width: 380,
    height: 320,
    frame: false,
    transparent: false,
    backgroundColor: '#0c0e12',
    icon: iconPath || undefined,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splash.setMenu(null);
  splash.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(SPLASH_HTML));
  splash.once('ready-to-show', () => splash.show());
  splash.on('closed', () => { splashWindow = null; });
  return splash;
}

/** Small window shown only when an update is running at startup (main app never opens). */
function createUpdateOnlyWindow(iconPath) {
  const win = new BrowserWindow({
    width: 400,
    height: 260,
    frame: false,
    transparent: false,
    backgroundColor: '#0c0e12',
    icon: iconPath || undefined,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  win.setMenu(null);
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(UPDATE_ONLY_HTML));
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { updateOnlyWindow = null; });
  return win;
}

function createWindow() {
  mainReady = false;
  const iconPath = getIconPath();
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'VibeMiner',
    icon: iconPath || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0c0e12',
    show: false,
  });

  // No menu bar — app feels like a normal desktop app, not a browser
  win.setMenu(null);

  if (iconPath && process.platform === 'win32') {
    win.setIcon(iconPath);
  }

  mainWindow = win;

  // Minimize to tray on close so mining can continue in background; quit only via tray menu
  win.on('close', (e) => {
    if (!isQuitting && tray) {
      e.preventDefault();
      win.hide();
    }
  });

  // Open external links (target="_blank" to other origins) in the system browser
  const appOrigin = isDev ? 'http://localhost:3000' : (process.env.APP_URL || 'https://vibeminer.tech');
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const base = new URL(appOrigin);
      if (u.origin !== base.origin) {
        shell.openExternal(url).catch(() => {});
        return { action: 'deny' };
      }
    } catch (_) {}
    return { action: 'allow' };
  });

  // Use a normal Chrome user agent so the web app doesn't block or treat the request differently
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  win.webContents.setUserAgent(chromeUA);

  const appUrl = isDev ? 'http://localhost:3000' : (process.env.APP_URL || 'https://vibeminer.tech');
  let hasShown = false;

  function showWhenReady() {
    if (!hasShown && !win.isDestroyed()) {
      hasShown = true;
      win.show();
    }
  }

  // Show window when main frame has finished loading (or after splash in prod)
  win.webContents.on('did-finish-load', () => {
    if (!win.isDestroyed()) {
      win.webContents.insertCSS('html, body { scrollbar-width: none; -ms-overflow-style: none; } html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }').catch(() => {});
      if (splashWindow) {
        mainReady = true;
        maybeShowMainAndCloseSplash();
      } else {
        showWhenReady();
      }
      if (!isDev) {
        if (updateDownloaded) {
          runAutoInstallIfReady();
        } else {
          runStartupUpdateCheck();
          runUpdateCheck();
        }
      }
    }
  });

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!win.isDestroyed() && isMainFrame && errorCode !== -3) {
      // -3 = ERR_ABORTED (e.g. navigation superseded). Show error page in both dev and prod
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(FAILED_LOAD_HTML));
    }
  });

  // If load hangs, show window and error after timeout so user isn't stuck
  const loadTimeout = setTimeout(() => {
    if (!hasShown && !win.isDestroyed()) {
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(
        FAILED_LOAD_HTML.replace('Can&rsquo;t connect', 'Taking too long')
          .replace('Check your internet connection, then try again.', 'The page is taking too long to load. Check your connection and try again.')
      ));
    }
  }, 15000);

  win.webContents.once('did-finish-load', () => clearTimeout(loadTimeout));

  if (isDev) {
    win.webContents.openDevTools();
  }
  win.loadURL(appUrl);

  win.on('closed', () => {
    mainWindow = null;
    clearTimeout(loadTimeout);
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });

  // Create system tray so app keeps running when window is closed (mining continues)
  if (iconPath) {
    tray = new Tray(iconPath);
    tray.setToolTip('VibeMiner — mining continues in background');
    tray.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show VibeMiner', click: () => { if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); } } },
      { type: 'separator' },
      { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
    ]);
    tray.setContextMenu(contextMenu);
  }
}

app.whenReady().then(async () => {
  if (!isDev) {
    configureUpdater();
    setupUpdaterEvents();
    scheduleAutoUpdateChecks();
  }

  ipcMain.handle('getAutoUpdateEnabled', () => loadSettings().autoUpdate);
  ipcMain.handle('setAutoUpdateEnabled', (_, enabled) => {
    const s = loadSettings();
    s.autoUpdate = !!enabled;
    saveSettings(s);
    scheduleAutoUpdateChecks();
    return s.autoUpdate;
  });
  ipcMain.handle('getAppVersion', () => app.getVersion());
  ipcMain.handle('reload', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload(); });
  ipcMain.handle('checkForUpdates', async () => {
    const currentVersion = app.getVersion();
    try {
      let result = await autoUpdater.checkForUpdatesAndNotify();
      let latestVersion = result?.updateInfo?.version || null;
      let updateAvailable = !!(result && result.updateInfo && latestVersion && isNewerVersion(currentVersion, latestVersion));

      // If electron-updater didn't find an update, try GitHub API and optionally retry the updater once.
      if (!updateAvailable) {
        const fromApi = await fetchLatestReleaseFromGitHub();
        if (fromApi && isNewerVersion(currentVersion, fromApi)) {
          console.info('[VibeMiner] GitHub API reports newer version:', fromApi, '- retrying updater once');
          result = await autoUpdater.checkForUpdatesAndNotify();
          const retryVersion = result?.updateInfo?.version || fromApi;
          if (isNewerVersion(currentVersion, retryVersion)) {
            updateAvailable = true;
            latestVersion = retryVersion;
            if (!result?.updateInfo) {
              console.info('[VibeMiner] Update available (from GitHub API; use Download installer):', latestVersion);
            }
          }
        }
      }

      if (updateAvailable && latestVersion) {
        console.info('[VibeMiner] Update available:', latestVersion);
        notifyUpdateAvailable(latestVersion);
      } else {
        console.info('[VibeMiner] Check complete. Current:', currentVersion, 'Latest:', latestVersion || 'same');
      }
      return {
        updateAvailable,
        latestVersion,
        releasePageUrl: RELEASE_PAGE_URL,
        directDownloadUrl: getDirectDownloadUrl(process.platform),
        error: false,
      };
    } catch (err) {
      console.error('[VibeMiner] Manual update check failed:', err?.message || err);
      if (err?.code) console.error('[VibeMiner] Error code:', err.code);
      try {
        const fromApi = await fetchLatestReleaseFromGitHub();
        if (fromApi && isNewerVersion(currentVersion, fromApi)) {
          notifyUpdateAvailable(fromApi);
          return {
            updateAvailable: true,
            latestVersion: fromApi,
            releasePageUrl: RELEASE_PAGE_URL,
            directDownloadUrl: getDirectDownloadUrl(process.platform),
            error: false,
          };
        }
      } catch (_) {
        // ignore
      }
      return { updateAvailable: false, latestVersion: null, error: true, message: err?.message || String(err) };
    }
  });
  ipcMain.handle('getUpdateDownloaded', () => updateDownloaded);
  ipcMain.handle('getUpdateAvailableInfo', () => {
    if (!latestUpdateAvailable?.latestVersion) return null;
    if (!isNewerVersion(app.getVersion(), latestUpdateAvailable.latestVersion)) return null;
    return latestUpdateAvailable;
  });
  ipcMain.handle('openExternal', (_, url) => {
    if (!url || typeof url !== 'string') return;
    try {
      const u = new URL(url);
      const protocol = u.protocol.toLowerCase();
      if (protocol !== 'https:' && protocol !== 'http:') return;
      if (protocol === 'http:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return;
      const host = u.hostname.toLowerCase();
      const allowedHosts = [
        'localhost',
        '127.0.0.1',
        'vibeminer.tech',
        'www.vibeminer.tech',
        'github.com',
        'www.github.com',
        'raw.githubusercontent.com',
        'api.github.com',
      ];
      if (allowedHosts.includes(host)) {
        shell.openExternal(url).catch(() => {});
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        const mainOrigin = mainWindow.webContents.getURL();
        try {
          const mainUrl = new URL(mainOrigin);
          if (mainUrl.hostname.toLowerCase() === host) shell.openExternal(url).catch(() => {});
        } catch (_) {}
      }
    } catch (_) {}
  });

  // Install update that electron-updater already downloaded (quit and run installer).
  ipcMain.handle('quitAndInstall', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  // Download installer in-app and run it after quit (progress in main window, no popup).
  ipcMain.handle('installUpdateNow', async () => {
    if (!latestUpdateAvailable?.directDownloadUrl) {
      return { ok: false, error: 'No update URL' };
    }
    const version = app.getVersion();
    if (latestUpdateAvailable.latestVersion && !isNewerVersion(version, latestUpdateAvailable.latestVersion)) {
      return { ok: false, error: 'Already up to date' };
    }

    // Show only the update window; hide main so the small update window is the only one visible
    if (mainWindow && !mainWindow.isDestroyed() && (!updateOnlyWindow || updateOnlyWindow.isDestroyed())) {
      updateOnlyWindow = createUpdateOnlyWindow(getIconPath());
      mainWindow.hide();
    }
    sendUpdateProgress('downloading');

    const url = latestUpdateAvailable.directDownloadUrl;
    const headers = {
      'User-Agent': `VibeMiner-updater/${version} (${process.platform}; ${process.arch})`,
      Accept: 'application/octet-stream',
    };
    const ext = path.extname(new URL(url).pathname) || (process.platform === 'win32' ? '.exe' : process.platform === 'darwin' ? '.dmg' : '');
    const tempDir = app.getPath('temp');
    const tempFile = path.join(tempDir, `VibeMiner-Update${ext}`);

    try {
      const res = await net.fetch(url, { headers });
      if (!res.ok) {
        return { ok: false, error: `Download failed: ${res.status}` };
      }
      const buf = await res.arrayBuffer();
      fs.writeFileSync(tempFile, new Uint8Array(buf), { flag: 'w' });
    } catch (err) {
      console.error('[VibeMiner] Update download failed:', err?.message || err);
      return { ok: false, error: err?.message || String(err) };
    }

    sendUpdateProgress('installing');
    await new Promise((r) => setTimeout(r, 2000));

    const platform = process.platform;
    const launchDelaySeconds = 8;
    const preQuitDelayMs = 4000;
    if (platform === 'win32') {
      const vbsPath = path.join(tempDir, 'VibeMiner-Update-Launcher.vbs');
      const vbsContent =
        'WScript.Sleep ' + (launchDelaySeconds * 1000) + '\n' +
        'CreateObject("WScript.Shell").Run Chr(34) & "' + tempFile.replace(/"/g, '""') + '" & Chr(34) & " /S --force-run", 0, False\n';
      fs.writeFileSync(vbsPath, vbsContent, 'utf8');
      const child = spawn('wscript.exe', ['//B', vbsPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
    } else if (platform === 'darwin') {
      const scriptPath = path.join(tempDir, 'VibeMiner-Update-Launcher.sh');
      fs.writeFileSync(scriptPath, `#!/bin/sh\nsleep ${launchDelaySeconds}\nopen "${tempFile.replace(/"/g, '\\"')}"\n`, 'utf8');
      fs.chmodSync(scriptPath, 0o755);
      const child = spawn(scriptPath, [], { detached: true, stdio: 'ignore' });
      child.unref();
    } else {
      const scriptPath = path.join(tempDir, 'VibeMiner-Update-Launcher.sh');
      fs.writeFileSync(scriptPath, `#!/bin/sh\nsleep ${launchDelaySeconds}\nchmod +x "${tempFile.replace(/"/g, '\\"')}"\nexec "${tempFile.replace(/"/g, '\\"')}"\n`, 'utf8');
      fs.chmodSync(scriptPath, 0o755);
      const child = spawn(scriptPath, [], { detached: true, stdio: 'ignore' });
      child.unref();
    }
    await new Promise((r) => setTimeout(r, preQuitDelayMs));
    app.quit();
    return { ok: true };
  });

  // Production (or simulate): if a newer version is available and auto-update is on, show only the update window and run the update (do not open the main app).
  // With --simulate-update or VIBEMINER_SIMULATE_UPDATE=1, we simulate this path without downloading/installing, then continue to the main app.
  if (simulateUpdateAtLaunch) {
    inAppUpdateInProgress = true;
    updateOnlyWindow = createUpdateOnlyWindow(getIconPath());
    setTimeout(async () => {
      await runSimulatedUpdateFlow(() => {
        if (!isDev) {
          splashWindow = createSplashWindow(getIconPath());
          setTimeout(() => {
            splashMinElapsed = true;
            maybeShowMainAndCloseSplash();
          }, SPLASH_MIN_MS);
        }
        createWindow();
      });
    }, 600);
    return;
  }

  if (!isDev && app.isPackaged) {
    try {
      const fromApi = await fetchLatestReleaseFromGitHub();
      const currentVersion = app.getVersion();
      if (fromApi && isNewerVersion(currentVersion, fromApi) && loadSettings().autoUpdate && !inAppUpdateInProgress) {
        inAppUpdateInProgress = true;
        updateOnlyWindow = createUpdateOnlyWindow(getIconPath());
        setTimeout(() => runInAppUpdateFlow(fromApi), 600);
        return;
      }
    } catch (err) {
      console.error('[VibeMiner] Startup update check failed:', err?.message || err);
    }
  }

  if (!isDev) {
    splashWindow = createSplashWindow(getIconPath());
    setTimeout(() => {
      splashMinElapsed = true;
      maybeShowMainAndCloseSplash();
    }, SPLASH_MIN_MS);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  // With tray: main window hides instead of closing, so app stays running. Quit only via tray > Quit.
  if (!tray && process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
