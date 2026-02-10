const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openGeoJSON: () => ipcRenderer.invoke('dialog:openFile'),
  saveGeoJSON: (defaultName, content) => ipcRenderer.invoke('dialog:saveFile', { defaultName, content }),
});
