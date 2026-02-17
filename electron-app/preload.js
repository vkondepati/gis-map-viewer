const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openGeoJSON: () => ipcRenderer.invoke('dialog:openFile'),
  saveGeoJSON: (defaultName, content) => ipcRenderer.invoke('dialog:saveFile', { defaultName, content }),
  saveTextFile: (defaultName, content) => ipcRenderer.invoke('dialog:saveTextFile', { defaultName, content }),
  writeGeoJSON: (filePath, content) => ipcRenderer.invoke('dialog:writeFile', { filePath, content }),
  openProject: () => ipcRenderer.invoke('dialog:openProjectFile'),
  saveProject: (defaultName, content, preferredPath) => ipcRenderer.invoke('dialog:saveProjectFile', { defaultName, content, preferredPath }),
  writeProject: (filePath, content) => ipcRenderer.invoke('dialog:writeProjectFile', { filePath, content }),
  deleteProject: (filePath) => ipcRenderer.invoke('dialog:deleteProjectFile', { filePath }),
  readProject: (filePath) => ipcRenderer.invoke('dialog:readProjectFile', { filePath }),
  saveCurrentWindowPdf: (options) => ipcRenderer.invoke('print:savePdf', options),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  listDirectory: (folderPath) => ipcRenderer.invoke('fs:listDirectory', { folderPath }),
  createFolder: (folderPath, name) => ipcRenderer.invoke('fs:createFolder', { folderPath, name }),
  createGeoJSONFile: (folderPath, name, columns, targetCrs) => ipcRenderer.invoke('fs:createGeoJSONFile', { folderPath, name, columns, targetCrs }),
  createKMLFile: (folderPath, name, columns, targetCrs) => ipcRenderer.invoke('fs:createKMLFile', { folderPath, name, columns, targetCrs }),
  createAttributesFile: (folderPath, name, columns) => ipcRenderer.invoke('fs:createAttributesFile', { folderPath, name, columns }),
  deletePath: (targetPath) => ipcRenderer.invoke('fs:deletePath', { targetPath }),
  askMapAssistant: (payload) => ipcRenderer.invoke('ai:mapAssistantAsk', payload),
  onOpenProjectFromShell: (callback) => {
    ipcRenderer.on('project:openPath', (event, payload) => callback(payload));
  },
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:action', (event, payload) => callback(payload));
  },
});
