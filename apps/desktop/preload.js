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
});
