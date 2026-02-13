function normalizeGeometryType(geomType) {
  switch (geomType) {
    case 'Point':
    case 'MultiPoint':
      return 'Point';
    case 'LineString':
    case 'MultiLineString':
      return 'LineString';
    case 'Polygon':
    case 'MultiPolygon':
      return 'Polygon';
    default:
      return 'Point';
  }
}

function inferGeometryTypeFromGeoJSON(geojson, fallback = 'Point') {
  if (!geojson || !Array.isArray(geojson.features)) return normalizeGeometryType(fallback);
  const firstWithGeometry = geojson.features.find((f) => f && f.geometry && f.geometry.type);
  if (!firstWithGeometry) return normalizeGeometryType(fallback);
  return normalizeGeometryType(firstWithGeometry.geometry.type);
}

function getFileBaseName(filePath = '') {
  const name = String(filePath).split(/[\\/]/).pop() || '';
  return name.replace(/\.[^/.]+$/, '') || 'Layer';
}

function getDashArrayForLineStyle(lineStyle) {
  if (lineStyle === 'dashed') return '8,6';
  if (lineStyle === 'dotted') return '2,6';
  return null;
}

function parseAttributeValue(raw) {
  const value = String(raw || '').trim();
  if (value === '') return undefined;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

module.exports = {
  normalizeGeometryType,
  inferGeometryTypeFromGeoJSON,
  getFileBaseName,
  getDashArrayForLineStyle,
  parseAttributeValue,
};
