const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Packaged app = production (no dev tools, load vibeminer.ai). Unpackaged = dev (localhost + dev tools).
const isDev = !app.isPackaged;

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
function scheduleAutoUpdateChecks() {
  if (updateCheckInterval) clearInterval(updateCheckInterval);
  if (!loadSettings().autoUpdate) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  updateCheckInterval = setInterval(() => autoUpdater.checkForUpdatesAndNotify().catch(() => {}), 4 * 60 * 60 * 1000);
}

const FAILED_LOAD_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibeMiner</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c0e12;color:#e5e7eb;font-family:system-ui,sans-serif;text-align:center;padding:1.5rem;}h1{font-size:1.25rem;margin-bottom:0.5rem;}p{color:#9ca3af;margin-bottom:1.5rem;}button{background:#22d3ee;color:#0c0e12;border:none;padding:0.75rem 1.5rem;border-radius:0.75rem;font-weight:600;cursor:pointer;}button:hover{filter:brightness(1.1);}</style></head><body><div><h1>Can&rsquo;t connect</h1><p>Check your internet connection, then try again.</p><button type="button" id="retry">Retry</button></div><script>document.getElementById("retry").onclick=function(){if(typeof window.electronAPI!=="undefined"&&window.electronAPI.reload){window.electronAPI.reload();}else{location.reload();}}</script></body></html>`;

let mainWindow = null;

function createWindow() {
  const buildDir = path.join(__dirname, 'build');
const iconName = process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
const iconPath = path.join(buildDir, iconName);
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

  const appUrl = isDev ? 'http://localhost:3000' : (process.env.APP_URL || 'https://vibeminer.ai');
  let hasShown = false;

  function showWhenReady() {
    if (!hasShown && !win.isDestroyed()) {
      hasShown = true;
      win.show();
    }
  }

  // Show window only when main frame has finished loading (avoids blank black screen)
  win.webContents.on('did-finish-load', () => {
    if (!win.isDestroyed()) showWhenReady();
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
  if (!isDev) scheduleAutoUpdateChecks();

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
      return { updateAvailable: !!(result && result.updateInfo) };
    } catch {
      return { updateAvailable: false, error: true };
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
