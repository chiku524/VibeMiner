const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  getAutoUpdateEnabled: () => ipcRenderer.invoke('getAutoUpdateEnabled'),
  setAutoUpdateEnabled: (enabled) => ipcRenderer.invoke('setAutoUpdateEnabled', enabled),
  getAppVersion: () => ipcRenderer.invoke('getAppVersion'),
});
