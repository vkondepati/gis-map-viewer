const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openGeoJSON: () => ipcRenderer.invoke('dialog:openFile'),
  saveGeoJSON: (defaultName, content) => ipcRenderer.invoke('dialog:saveFile', { defaultName, content }),
  writeGeoJSON: (filePath, content) => ipcRenderer.invoke('dialog:writeFile', { filePath, content }),
  openProject: () => ipcRenderer.invoke('dialog:openProjectFile'),
  saveProject: (defaultName, content, preferredPath) => ipcRenderer.invoke('dialog:saveProjectFile', { defaultName, content, preferredPath }),
  writeProject: (filePath, content) => ipcRenderer.invoke('dialog:writeProjectFile', { filePath, content }),
  deleteProject: (filePath) => ipcRenderer.invoke('dialog:deleteProjectFile', { filePath }),
  readProject: (filePath) => ipcRenderer.invoke('dialog:readProjectFile', { filePath }),
  saveCurrentWindowPdf: (options) => ipcRenderer.invoke('print:savePdf', options),
  onOpenProjectFromShell: (callback) => {
    ipcRenderer.on('project:openPath', (event, payload) => callback(payload));
  },
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:action', (event, payload) => callback(payload));
  },
});
