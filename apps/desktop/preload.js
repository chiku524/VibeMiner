const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  versions: process.versions,
  getAutoUpdateEnabled: () => ipcRenderer.invoke('getAutoUpdateEnabled'),
  setAutoUpdateEnabled: (enabled) => ipcRenderer.invoke('setAutoUpdateEnabled', enabled),
  getAppVersion: () => ipcRenderer.invoke('getAppVersion'),
  reload: () => ipcRenderer.invoke('reload'),
  checkForUpdates: () => ipcRenderer.invoke('checkForUpdates'),
  getUpdateDownloaded: () => ipcRenderer.invoke('getUpdateDownloaded'),
  getUpdateAvailableInfo: () => ipcRenderer.invoke('getUpdateAvailableInfo'),
  openExternal: (url) => ipcRenderer.invoke('openExternal', url),
  quitAndInstall: () => ipcRenderer.invoke('quitAndInstall'),
  installUpdateNow: () => ipcRenderer.invoke('installUpdateNow'),
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', () => callback());
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
});
