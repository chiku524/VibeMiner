const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'VibeMiner',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0c0e12',
    show: false,
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // Production: load from deployed URL (Cloudflare Pages or your domain)
    const appUrl = process.env.APP_URL || 'https://vibeminer.ai';
    win.loadURL(appUrl);
  }

  win.once('ready-to-show', () => win.show());
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

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
