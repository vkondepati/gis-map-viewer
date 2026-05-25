const test = require('node:test');
const assert = require('node:assert/strict');

const { serializeProjectLayer } = require('../shared/core/project-io');

test('serializeProjectLayer preserves GeoJSON layer fields', () => {
  const layerEntry = {
    id: 'layer-1',
    name: 'Roads',
    visible: true,
    geometryType: 'LineString',
    sourcePath: 'roads.geojson',
    sourceType: 'geojson',
    geojson: { type: 'FeatureCollection', features: [] },
  };
  const serialized = serializeProjectLayer(layerEntry, {
    layerSym: {},
    layerLabels: {},
    getDefaultSymbology: () => ({ color: '#ff7800' }),
    labelStyleDefaults: { fontSize: 12 },
  });
  assert.equal(serialized.sourceType, 'geojson');
  assert.equal(serialized.sourcePath, 'roads.geojson');
  assert.deepEqual(serialized.geojson, { type: 'FeatureCollection', features: [] });
  assert.equal(serialized.serviceMetadata, null);
});

test('serializeProjectLayer preserves ArcGIS REST metadata', () => {
  const layerEntry = {
    id: 'layer-2',
    name: 'Wildfire',
    visible: false,
    geometryType: 'Polygon',
    sourcePath: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/2',
    sourceType: 'arcgis-rest',
    geojson: null,
    serviceMetadata: { id: 2, name: 'Wildfire Response Polygons' },
  };
  const serialized = serializeProjectLayer(layerEntry, {
    layerSym: {},
    layerLabels: {},
    getDefaultSymbology: () => ({ color: '#ff7800' }),
    labelStyleDefaults: { fontSize: 12 },
  });
  assert.equal(serialized.sourceType, 'arcgis-rest');
  assert.equal(serialized.visible, false);
  assert.deepEqual(serialized.serviceMetadata, { id: 2, name: 'Wildfire Response Polygons' });
  assert.equal(serialized.geojson, null);
});

test('serializeProjectLayer merges default label options when labels exist', () => {
  const layerEntry = {
    id: 'layer-3',
    name: 'Parcels',
    visible: true,
    geometryType: 'Polygon',
    sourcePath: null,
    sourceType: 'geojson',
    geojson: { type: 'FeatureCollection', features: [] },
  };
  const serialized = serializeProjectLayer(layerEntry, {
    layerSym: {},
    layerLabels: {
      'layer-3': {
        columnName: 'parcel_id',
        enabled: true,
        options: { color: '#112233' },
      },
    },
    getDefaultSymbology: () => ({ color: '#ff7800' }),
    labelStyleDefaults: { fontSize: 12, color: '#000000', placement: 'center' },
  });

  assert.deepEqual(serialized.labels, {
    columnName: 'parcel_id',
    enabled: true,
    options: { fontSize: 12, color: '#112233', placement: 'center' },
  });
});
