const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeGeometryType,
  inferGeometryTypeFromGeoJSON,
  getFileBaseName,
  getDashArrayForLineStyle,
  parseAttributeValue,
} = require('../electron-app/renderer/logic');

test('normalizeGeometryType maps multi geometries to canonical types', () => {
  assert.equal(normalizeGeometryType('MultiPoint'), 'Point');
  assert.equal(normalizeGeometryType('MultiLineString'), 'LineString');
  assert.equal(normalizeGeometryType('MultiPolygon'), 'Polygon');
  assert.equal(normalizeGeometryType('UnknownType'), 'Point');
});

test('inferGeometryTypeFromGeoJSON returns fallback when features missing', () => {
  assert.equal(inferGeometryTypeFromGeoJSON(null, 'LineString'), 'LineString');
  assert.equal(inferGeometryTypeFromGeoJSON({ type: 'FeatureCollection', features: [] }, 'Polygon'), 'Polygon');
});

test('inferGeometryTypeFromGeoJSON infers from first feature with geometry', () => {
  const fc = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: null },
      { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: [] } },
    ],
  };
  assert.equal(inferGeometryTypeFromGeoJSON(fc, 'Point'), 'LineString');
});

test('getFileBaseName strips extension and handles windows/unix paths', () => {
  assert.equal(getFileBaseName('C:\\data\\roads.geojson'), 'roads');
  assert.equal(getFileBaseName('/tmp/parcels.json'), 'parcels');
  assert.equal(getFileBaseName(''), 'Layer');
});

test('getDashArrayForLineStyle supports dashed and dotted', () => {
  assert.equal(getDashArrayForLineStyle('dashed'), '8,6');
  assert.equal(getDashArrayForLineStyle('dotted'), '2,6');
  assert.equal(getDashArrayForLineStyle('solid'), null);
});

test('parseAttributeValue parses JSON literals and falls back to strings', () => {
  assert.equal(parseAttributeValue(' 42 '), 42);
  assert.equal(parseAttributeValue(' true '), true);
  assert.deepEqual(parseAttributeValue('{"a":1}'), { a: 1 });
  assert.equal(parseAttributeValue('abc'), 'abc');
  assert.equal(parseAttributeValue('   '), undefined);
});
