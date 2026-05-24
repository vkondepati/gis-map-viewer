(function initWebPlatform(globalScope) {
  const root = globalScope || window;

  function blobDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'download.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return { canceled: false, path: filename || 'download.txt' };
  }

  function pickFiles({ accept = '', multiple = false } = {}) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = !!multiple;
      input.addEventListener('change', () => {
        resolve(Array.from(input.files || []));
      }, { once: true });
      input.click();
    });
  }

  function fileToText(file) {
    return file.text();
  }

  async function fileToBase64(file) {
    const buffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function getApiBaseUrl() {
    const config = root.__NEXAMAP_WEB_CONFIG__ || {};
    return String(config.apiBaseUrl || '/api').replace(/\/+$/, '');
  }

  function normalizeSelectedPrimaryFile(files) {
    if (!files || files.length === 0) return null;
    return files.find((file) => /\.(zip|shp|geojson|json)$/i.test(file.name)) || files[0];
  }

  async function openSpatialFile() {
    const files = await pickFiles({
      accept: '.geojson,.json,.zip,.shp,.dbf,.prj,.cpg,.shx',
      multiple: true,
    });
    if (!files.length) return { canceled: true };
    const primary = normalizeSelectedPrimaryFile(files);
    if (!primary) return { canceled: true };
    const extensionMatch = /\.[^/.]+$/.exec(primary.name);
    const extension = extensionMatch ? extensionMatch[0].toLowerCase() : '';
    const isTextFile = ['.geojson', '.json', '.prj', '.cpg', '.txt', '.xml'].includes(extension);
    const content = isTextFile ? await fileToText(primary) : await fileToBase64(primary);
    const response = {
      canceled: false,
      path: primary.name,
      content,
      extension,
      encoding: isTextFile ? 'utf8' : 'base64',
    };
    if (extension === '.shp') {
      const basename = primary.name.replace(/\.[^/.]+$/, '');
      const relatedFiles = {};
      for (const file of files) {
        const match = /\.([^.]+)$/.exec(file.name);
        if (!match) continue;
        const sidecarExt = `.${match[1].toLowerCase()}`;
        if (!['.dbf', '.prj', '.cpg', '.shx'].includes(sidecarExt)) continue;
        if (file.name.replace(/\.[^/.]+$/, '') !== basename) continue;
        const sidecarIsText = ['.prj', '.cpg'].includes(sidecarExt);
        relatedFiles[sidecarExt.slice(1)] = {
          path: file.name,
          encoding: sidecarIsText ? 'utf8' : 'base64',
          content: sidecarIsText ? await fileToText(file) : await fileToBase64(file),
        };
      }
      response.relatedFiles = relatedFiles;
    }
    return response;
  }

  async function openProject() {
    const files = await pickFiles({ accept: '.prj,.json', multiple: false });
    if (!files.length) return { canceled: true };
    const file = files[0];
    return {
      canceled: false,
      path: file.name,
      content: await fileToText(file),
    };
  }

  async function saveProject(defaultName, content) {
    return blobDownload(defaultName || 'project.prj', content, 'application/json');
  }

  async function writeProject(filePath, content) {
    return blobDownload(filePath || 'project.prj', content, 'application/json');
  }

  async function readProject() {
    return { canceled: true, error: 'Shell-based project open is not available in the web version.' };
  }

  async function saveGeoJSON(defaultName, content) {
    return blobDownload(defaultName || 'export.geojson', content, 'application/geo+json');
  }

  async function saveTextFile(defaultName, content) {
    return blobDownload(defaultName || 'export.txt', content, 'text/plain;charset=utf-8');
  }

  async function writeGeoJSON(filePath, content) {
    return blobDownload(filePath || 'export.geojson', content, 'application/geo+json');
  }

  async function unsupportedWorkspaceOperation() {
    return { ok: false, error: 'Workspace file operations are not supported in the web version.' };
  }

  async function unsupportedFolderPicker() {
    return { canceled: true, error: 'Folder selection is not supported in the web version.' };
  }

  async function saveCurrentWindowPdf(options = {}) {
    root.print();
    return { canceled: false, path: options.defaultName || 'browser-print' };
  }

  async function askMapAssistant(payload) {
    const response = await fetch(`${getApiBaseUrl()}/map-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    return response.json();
  }

  root.NexaMapPlatforms = root.NexaMapPlatforms || {};
  root.NexaMapPlatforms.web = function createWebPlatform() {
    const menuListeners = [];
    const platform = {
      kind: 'web',
      supportsWorkspaceOps: false,
      openSpatialFile,
      saveGeoJSON,
      saveTextFile,
      writeGeoJSON,
      openProject,
      saveProject,
      writeProject,
      readProject,
      deleteProject: async () => ({ ok: false, error: 'Project deletion is not supported in the web version.' }),
      pickFolder: unsupportedFolderPicker,
      listDirectory: unsupportedWorkspaceOperation,
      createFolder: unsupportedWorkspaceOperation,
      createGeoJSONFile: unsupportedWorkspaceOperation,
      createKMLFile: unsupportedWorkspaceOperation,
      createAttributesFile: unsupportedWorkspaceOperation,
      deletePath: unsupportedWorkspaceOperation,
      saveCurrentWindowPdf,
      askMapAssistant,
      onOpenProjectFromShell() {},
      onMenuAction(handler) {
        if (typeof handler === 'function') menuListeners.push(handler);
      },
      triggerMenuAction(payload) {
        menuListeners.forEach((handler) => {
          Promise.resolve(handler(payload)).catch((err) => {
            console.error('Web menu action failed:', err);
          });
        });
      },
    };
    root.NexaMapWebPlatform = platform;
    return platform;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getApiBaseUrl,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
