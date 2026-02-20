const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Packaged app = production (no dev tools, load vibeminer.tech). Unpackaged = dev (localhost + dev tools).
const isDev = !app.isPackaged;

// GitHub API requires a valid User-Agent; otherwise requests can get 403 and no update is found.
function configureUpdater() {
  const version = app.getVersion();
  autoUpdater.requestHeaders = {
    'User-Agent': `VibeMiner-updater/${version} (${process.platform}; ${process.arch})`,
    Accept: 'application/vnd.github.v3+json',
  };
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

  // First check after a short delay so app and network are ready (avoids silent failures on cold start)
  setTimeout(() => runUpdateCheck(), 2000);
  // Second check after window has been open a bit so any notification is visible
  setTimeout(() => runUpdateCheck(), 8000);
  // Then every 4 hours
  updateCheckInterval = setInterval(runUpdateCheck, 4 * 60 * 60 * 1000);
}

function setupUpdaterEvents() {
  autoUpdater.on('error', (err) => console.error('[VibeMiner] Updater error:', err?.message || err));
  autoUpdater.on('update-available', (info) => {
    console.info('[VibeMiner] Update available:', info?.version || 'unknown', '- downloading…');
  });
  autoUpdater.on('update-not-available', (info) => {
    console.info('[VibeMiner] No update (current:', app.getVersion(), ', latest:', info?.version || 'unknown', ')');
  });
  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-downloaded');
  });
}

const FAILED_LOAD_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibeMiner</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c0e12;color:#e5e7eb;font-family:system-ui,sans-serif;text-align:center;padding:1.5rem;}h1{font-size:1.25rem;margin-bottom:0.5rem;}p{color:#9ca3af;margin-bottom:1.5rem;}button{background:#22d3ee;color:#0c0e12;border:none;padding:0.75rem 1.5rem;border-radius:0.75rem;font-weight:600;cursor:pointer;}button:hover{filter:brightness(1.1);}</style></head><body><div><h1>Can&rsquo;t connect</h1><p>Check your internet connection, then try again.</p><button type="button" id="retry">Retry</button></div><script>document.getElementById("retry").onclick=function(){if(typeof window.electronAPI!=="undefined"&&window.electronAPI.reload){window.electronAPI.reload();}else{location.reload();}}</script></body></html>`;

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
let mainReady = false;
let splashMinElapsed = false;

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

function createWindow() {
  mainReady = false;
  // Resolve icon: when packaged, use unpacked resources so Windows taskbar gets the correct icon
  const iconName = process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
  let iconPath = path.join(__dirname, 'build', iconName);
  if (app.isPackaged && process.resourcesPath) {
    const unpackedIcon = path.join(process.resourcesPath, 'app.asar.unpacked', 'build', iconName);
    if (fs.existsSync(unpackedIcon)) iconPath = unpackedIcon;
  }
  if (!fs.existsSync(iconPath)) iconPath = path.join(__dirname, 'build', iconName);
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'VibeMiner',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
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

  mainWindow = win;

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

  win.on('closed', () => { mainWindow = null; clearTimeout(loadTimeout); });
}

app.whenReady().then(() => {
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
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      const updateAvailable = !!(result && result.updateInfo);
      const latestVersion = result?.updateInfo?.version || null;
      if (updateAvailable) {
        console.info('[VibeMiner] Update available:', latestVersion);
      } else {
        console.info('[VibeMiner] Check complete. Current:', app.getVersion(), 'Latest:', latestVersion || 'same');
      }
      return { updateAvailable, latestVersion, error: false };
    } catch (err) {
      console.error('[VibeMiner] Manual update check failed:', err?.message || err);
      return { updateAvailable: false, latestVersion: null, error: true, message: err?.message || String(err) };
    }
  });
  ipcMain.handle('getUpdateDownloaded', () => updateDownloaded);

  if (!isDev) {
    const iconName = process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
    let iconPath = path.join(__dirname, 'build', iconName);
    if (app.isPackaged && process.resourcesPath) {
      const unpackedIcon = path.join(process.resourcesPath, 'app.asar.unpacked', 'build', iconName);
      if (fs.existsSync(unpackedIcon)) iconPath = unpackedIcon;
    }
    if (!fs.existsSync(iconPath)) iconPath = path.join(__dirname, 'build', iconName);
    splashWindow = createSplashWindow(fs.existsSync(iconPath) ? iconPath : null);
    setTimeout(() => {
      splashMinElapsed = true;
      maybeShowMainAndCloseSplash();
    }, SPLASH_MIN_MS);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
