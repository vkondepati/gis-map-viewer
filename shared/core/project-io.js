(function initProjectIoCore(globalScope) {
  const root = globalScope || window;
  root.NexaMapCore = root.NexaMapCore || {};

  function serializeProjectLayer(layerEntry, deps) {
    const {
      layerSym,
      layerLabels,
      getDefaultSymbology,
      labelStyleDefaults,
    } = deps;

    return {
      id: layerEntry.id,
      name: layerEntry.name,
      visible: layerEntry.visible !== false,
      geometryType: layerEntry.geometryType,
      sourcePath: layerEntry.sourcePath || null,
      sourceType: layerEntry.sourceType || 'geojson',
      serviceMetadata: layerEntry.sourceType === 'arcgis-rest' ? (layerEntry.serviceMetadata || null) : null,
      geojson: layerEntry.geojson || null,
      symbology: layerSym[layerEntry.id] || getDefaultSymbology(layerEntry.geometryType || 'Point'),
      labels: layerLabels[layerEntry.id]
        ? {
            columnName: layerLabels[layerEntry.id].columnName,
            enabled: layerLabels[layerEntry.id].enabled !== false,
            options: Object.assign({}, labelStyleDefaults, layerLabels[layerEntry.id].options || {}),
          }
        : null,
    };
  }

  root.NexaMapCore.projectIo = {
    serializeProjectLayer,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      serializeProjectLayer,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
