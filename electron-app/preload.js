const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openGeoJSON: () => ipcRenderer.invoke('dialog:openFile'),
});
