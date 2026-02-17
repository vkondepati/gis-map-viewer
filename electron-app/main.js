const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let pendingProjectPath = null;

function loadDotEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const text = fs.readFileSync(filePath, 'utf8');
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) return;
      const key = match[1];
      if (Object.prototype.hasOwnProperty.call(process.env, key) && process.env[key] !== undefined) return;
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.replace(/\\n/g, '\n');
    });
  } catch (err) {
    console.warn(`Failed loading env file ${filePath}: ${err.message}`);
  }
}

function loadEnvironmentFiles() {
  const hereEnv = path.join(__dirname, '.env');
  const parentEnv = path.join(__dirname, '..', '.env');
  loadDotEnvFile(parentEnv);
  loadDotEnvFile(hereEnv);
}

loadEnvironmentFiles();

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

function trimText(input, maxLength = 1200) {
  const normalized = String(input || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function extractResponseText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  if (!Array.isArray(payload.output)) return '';
  const out = [];
  payload.output.forEach((item) => {
    if (!item || !Array.isArray(item.content)) return;
    item.content.forEach((part) => {
      if (!part || typeof part !== 'object') return;
      if (typeof part.text === 'string' && part.text.trim()) out.push(part.text.trim());
      if (typeof part.output_text === 'string' && part.output_text.trim()) out.push(part.output_text.trim());
    });
  });
  return out.join('\n').trim();
}

async function callOpenAIMapAssistant(question, mapContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY is not configured in environment variables.' };
  const model = /^[a-zA-Z0-9._:-]{1,80}$/.test(process.env.OPENAI_MODEL || '')
    ? process.env.OPENAI_MODEL
    : 'gpt-4o-mini';
  const sanitizedQuestion = trimText(question, 1500);
  const contextString = trimText(JSON.stringify(mapContext || {}, null, 2), 24000);
  const systemPrompt = [
    'You are a GIS assistant for a desktop map application.',
    'Answer only from provided map context and user question.',
    'If context is insufficient, clearly say what is missing.',
    'Do not claim access to files, network, or external tools.',
    'Keep answers concise and practical.',
  ].join(' ');
  const userPrompt = `User question:\n${sanitizedQuestion}\n\nMap context JSON:\n${contextString}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
        ],
        temperature: 0.2,
        max_output_tokens: 650,
      }),
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) {
      const errMsg = payload && payload.error && payload.error.message
        ? payload.error.message
        : `OpenAI request failed with status ${response.status}`;
      return { ok: false, error: errMsg };
    }
    const text = extractResponseText(payload);
    if (!text) return { ok: false, error: 'Assistant returned an empty response.' };
    return { ok: true, answer: text };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, error: 'Assistant request timed out. Please try again.' };
    }
    return { ok: false, error: err && err.message ? err.message : 'Assistant request failed.' };
  } finally {
    clearTimeout(timeoutId);
  }
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

ipcMain.handle('dialog:saveTextFile', async (event, { defaultName, content }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultName || 'export.csv',
    filters: [
      { name: 'CSV', extensions: ['csv'] },
      { name: 'Text', extensions: ['txt'] },
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

ipcMain.handle('dialog:pickFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (canceled || !filePaths || filePaths.length === 0) return { canceled: true };
  return { canceled: false, path: filePaths[0] };
});

ipcMain.handle('fs:listDirectory', async (event, { folderPath }) => {
  if (!folderPath) return { ok: false, error: 'Missing folder path' };
  try {
    const dirents = fs.readdirSync(folderPath, { withFileTypes: true });
    const entries = dirents
      .map((d) => ({
        name: d.name,
        path: path.join(folderPath, d.name),
        kind: d.isDirectory() ? 'folder' : 'file',
      }))
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    return { ok: true, entries };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

function sanitizeBaseName(input, fallback = 'new_item') {
  const raw = String(input || '').trim();
  const safe = raw.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ');
  return safe || fallback;
}

ipcMain.handle('fs:createFolder', async (event, { folderPath, name }) => {
  if (!folderPath) return { ok: false, error: 'Missing folder path' };
  try {
    const finalName = sanitizeBaseName(name, 'new_folder');
    const full = path.join(folderPath, finalName);
    if (fs.existsSync(full)) return { ok: false, error: 'Folder already exists' };
    fs.mkdirSync(full, { recursive: true });
    return { ok: true, path: full };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('fs:createGeoJSONFile', async (event, { folderPath, name, columns, targetCrs }) => {
  if (!folderPath) return { ok: false, error: 'Missing folder path' };
  try {
    const base = sanitizeBaseName(name, 'new_layer');
    const filename = base.toLowerCase().endsWith('.geojson') ? base : `${base}.geojson`;
    const full = path.join(folderPath, filename);
    if (fs.existsSync(full)) return { ok: false, error: 'File already exists' };
    const sanitizedColumns = Array.isArray(columns)
      ? columns.map((c) => String(c || '').trim()).filter((c) => c.length > 0)
      : [];
    const content = JSON.stringify({
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: targetCrs || 'EPSG:4326' } },
      schema: { columns: sanitizedColumns },
      features: [],
    }, null, 2);
    fs.writeFileSync(full, content, 'utf8');
    return { ok: true, path: full };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('fs:createKMLFile', async (event, { folderPath, name, columns, targetCrs }) => {
  if (!folderPath) return { ok: false, error: 'Missing folder path' };
  try {
    const base = sanitizeBaseName(name, 'new_layer');
    const filename = base.toLowerCase().endsWith('.kml') ? base : `${base}.kml`;
    const full = path.join(folderPath, filename);
    if (fs.existsSync(full)) return { ok: false, error: 'File already exists' };
    const sanitizedColumns = Array.isArray(columns)
      ? columns.map((c) => String(c || '').trim()).filter((c) => c.length > 0)
      : [];
    const schemaFields = sanitizedColumns
      .map((col) => `      <SimpleField name="${col}" type="string"></SimpleField>`)
      .join('\n');
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${base}</name>
    <description>Target CRS: ${targetCrs || 'EPSG:4326'}</description>
    <Schema id="${base}_schema">
${schemaFields}
    </Schema>
  </Document>
</kml>
`;
    fs.writeFileSync(full, content, 'utf8');
    return { ok: true, path: full };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('fs:createAttributesFile', async (event, { folderPath, name, columns }) => {
  if (!folderPath) return { ok: false, error: 'Missing folder path' };
  try {
    const base = sanitizeBaseName(name, 'attributes');
    const filename = base.toLowerCase().endsWith('.csv') ? base : `${base}.csv`;
    const full = path.join(folderPath, filename);
    if (fs.existsSync(full)) return { ok: false, error: 'File already exists' };
    const sanitizedColumns = Array.isArray(columns)
      ? columns.map((c) => String(c || '').trim()).filter((c) => c.length > 0)
      : [];
    const header = (sanitizedColumns.length > 0 ? sanitizedColumns : ['id', 'name']).join(',');
    const content = `${header}\n`;
    fs.writeFileSync(full, content, 'utf8');
    return { ok: true, path: full };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('fs:deletePath', async (event, { targetPath }) => {
  if (!targetPath) return { ok: false, error: 'Missing target path' };
  try {
    if (!fs.existsSync(targetPath)) return { ok: false, error: 'Path not found' };
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) fs.rmSync(targetPath, { recursive: true, force: false });
    else fs.unlinkSync(targetPath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('ai:mapAssistantAsk', async (event, payload = {}) => {
  const question = typeof payload === 'object' && payload !== null
    ? payload.question
    : '';
  const mapContext = typeof payload === 'object' && payload !== null
    ? (payload.mapContext || {})
    : {};
  const sanitizedQuestion = String(question || '').trim();
  if (!sanitizedQuestion) return { ok: false, error: 'Question is required.' };
  return callOpenAIMapAssistant(sanitizedQuestion, mapContext || {});
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
