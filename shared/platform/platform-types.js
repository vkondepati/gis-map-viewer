(function initPlatformTypes(globalScope) {
  const root = globalScope || window;

  // Documentation-only shape for platform adapters used by NexaMap shells.
  root.NexaMapPlatformTypes = {
    methods: [
      'openSpatialFile',
      'saveGeoJSON',
      'saveTextFile',
      'writeGeoJSON',
      'openProject',
      'saveProject',
      'writeProject',
      'readProject',
      'deleteProject',
      'pickFolder',
      'listDirectory',
      'createFolder',
      'createGeoJSONFile',
      'createKMLFile',
      'createAttributesFile',
      'deletePath',
      'saveCurrentWindowPdf',
      'askMapAssistant',
      'onOpenProjectFromShell',
      'onMenuAction',
    ],
  };
})(window);
