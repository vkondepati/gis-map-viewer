(function initDesktopPlatform(globalScope) {
  const root = globalScope || window;

  function notAvailable(name) {
    return async function unavailable() {
      throw new Error(`Desktop platform method "${name}" is not available.`);
    };
  }

  function optionalNoop() {}

  root.NexaMapPlatforms = root.NexaMapPlatforms || {};
  root.NexaMapPlatforms.desktop = function createDesktopPlatform(electronAPI) {
    const api = electronAPI || {};
    return {
      openSpatialFile: typeof api.openSpatialFile === 'function' ? api.openSpatialFile.bind(api) : notAvailable('openSpatialFile'),
      saveGeoJSON: typeof api.saveGeoJSON === 'function' ? api.saveGeoJSON.bind(api) : notAvailable('saveGeoJSON'),
      saveTextFile: typeof api.saveTextFile === 'function' ? api.saveTextFile.bind(api) : notAvailable('saveTextFile'),
      writeGeoJSON: typeof api.writeGeoJSON === 'function' ? api.writeGeoJSON.bind(api) : notAvailable('writeGeoJSON'),
      openProject: typeof api.openProject === 'function' ? api.openProject.bind(api) : notAvailable('openProject'),
      saveProject: typeof api.saveProject === 'function' ? api.saveProject.bind(api) : notAvailable('saveProject'),
      writeProject: typeof api.writeProject === 'function' ? api.writeProject.bind(api) : notAvailable('writeProject'),
      readProject: typeof api.readProject === 'function' ? api.readProject.bind(api) : notAvailable('readProject'),
      deleteProject: typeof api.deleteProject === 'function' ? api.deleteProject.bind(api) : notAvailable('deleteProject'),
      pickFolder: typeof api.pickFolder === 'function' ? api.pickFolder.bind(api) : notAvailable('pickFolder'),
      listDirectory: typeof api.listDirectory === 'function' ? api.listDirectory.bind(api) : notAvailable('listDirectory'),
      createFolder: typeof api.createFolder === 'function' ? api.createFolder.bind(api) : notAvailable('createFolder'),
      createGeoJSONFile: typeof api.createGeoJSONFile === 'function' ? api.createGeoJSONFile.bind(api) : notAvailable('createGeoJSONFile'),
      createKMLFile: typeof api.createKMLFile === 'function' ? api.createKMLFile.bind(api) : notAvailable('createKMLFile'),
      createAttributesFile: typeof api.createAttributesFile === 'function' ? api.createAttributesFile.bind(api) : notAvailable('createAttributesFile'),
      deletePath: typeof api.deletePath === 'function' ? api.deletePath.bind(api) : notAvailable('deletePath'),
      saveCurrentWindowPdf: typeof api.saveCurrentWindowPdf === 'function' ? api.saveCurrentWindowPdf.bind(api) : notAvailable('saveCurrentWindowPdf'),
      askMapAssistant: typeof api.askMapAssistant === 'function' ? api.askMapAssistant.bind(api) : notAvailable('askMapAssistant'),
      onOpenProjectFromShell: typeof api.onOpenProjectFromShell === 'function' ? api.onOpenProjectFromShell.bind(api) : optionalNoop,
      onMenuAction: typeof api.onMenuAction === 'function' ? api.onMenuAction.bind(api) : optionalNoop,
    };
  };
})(window);
