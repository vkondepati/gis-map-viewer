const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let pendingProjectPath = null;

function getProjectPathFromArgv(argv = []) {
  const candidate = argv.find((arg) => typeof arg === 'string' && /\.prj$/i.test(arg) && fs.existsSync(arg));
  return candidate || null;
}

function notifyProjectOpen(projectPath) {
  if (!projectPath) return;
  if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('project:openPath', { path: projectPath });
    return;
  }
  pendingProjectPath = projectPath;
}

function sendMenuAction(action) {
  if (!action) return;
  if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('menu:action', { action });
  }
}

function setupApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: () => sendMenuAction('open-project') },
        { label: 'Create Project', accelerator: 'CmdOrCtrl+N', click: () => sendMenuAction('create-project') },
        { label: 'Close Project', accelerator: 'CmdOrCtrl+W', click: () => sendMenuAction('close-project') },
        { type: 'separator' },
        { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: () => sendMenuAction('save-project') },
        { label: 'Save Project As', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenuAction('save-project-as') },
        { type: 'separator' },
        ...(isMac ? [{ role: 'close' }] : [{ role: 'quit' }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
            ]
          : [
              { role: 'delete' },
              { type: 'separator' },
              { role: 'selectAll' },
            ]),
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'NexaMap',
          enabled: false,
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingProjectPath) {
      mainWindow.webContents.send('project:openPath', { path: pendingProjectPath });
      pendingProjectPath = null;
    }
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    const projectPath = getProjectPathFromArgv(argv);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    if (projectPath) notifyProjectOpen(projectPath);
  });
}

app.whenReady().then(() => {
  pendingProjectPath = getProjectPathFromArgv(process.argv);
  setupApplicationMenu();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (/\.prj$/i.test(filePath) && fs.existsSync(filePath)) {
    notifyProjectOpen(filePath);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'GeoJSON', extensions: ['geojson', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePaths || filePaths.length === 0) return { canceled: true };
  const content = fs.readFileSync(filePaths[0], 'utf8');
  return { canceled: false, path: filePaths[0], content };
});

ipcMain.handle('dialog:saveFile', async (event, { defaultName, content }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultName || 'export.geojson',
    filters: [
      { name: 'GeoJSON', extensions: ['geojson', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePath) return { canceled: true };
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { canceled: false, path: filePath };
  } catch (err) {
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('dialog:writeFile', async (event, { filePath, content }) => {
  if (!filePath) return { ok: false, error: 'Missing file path' };
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dialog:openProjectFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Project', extensions: ['prj'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePaths || filePaths.length === 0) return { canceled: true };
  try {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { canceled: false, path: filePaths[0], content };
  } catch (err) {
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('dialog:saveProjectFile', async (event, { defaultName, content, preferredPath }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: preferredPath || defaultName || 'project.prj',
    filters: [
      { name: 'Project', extensions: ['prj'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePath) return { canceled: true };
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { canceled: false, path: filePath };
  } catch (err) {
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('dialog:writeProjectFile', async (event, { filePath, content }) => {
  if (!filePath) return { ok: false, error: 'Missing file path' };
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dialog:deleteProjectFile', async (event, { filePath }) => {
  if (!filePath) return { ok: false, error: 'Missing file path' };
  try {
    if (!fs.existsSync(filePath)) return { ok: false, error: 'Project file not found' };
    fs.unlinkSync(filePath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dialog:readProjectFile', async (event, { filePath }) => {
  if (!filePath) return { canceled: true, error: 'Missing file path' };
  try {
    if (!fs.existsSync(filePath)) return { canceled: true, error: 'Project file not found' };
    const content = fs.readFileSync(filePath, 'utf8');
    return { canceled: false, path: filePath, content };
  } catch (err) {
    return { canceled: true, error: err.message };
  }
});

ipcMain.handle('print:savePdf', async (event, options = {}) => {
  const sender = event.sender;
  const win = BrowserWindow.fromWebContents(sender);
  if (!win) return { canceled: true, error: 'No active window' };

  const defaultName = options.defaultName || 'map-export.pdf';
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePath) return { canceled: true };

  try {
    const pdfBuffer = await sender.printToPDF({
      landscape: options.orientation === 'landscape',
      pageSize: options.pageSize || 'A4',
      printBackground: true,
      margins: { marginType: 'default' },
    });
    fs.writeFileSync(filePath, pdfBuffer);
    return { canceled: false, path: filePath };
  } catch (err) {
    return { canceled: true, error: err.message };
  }
});
