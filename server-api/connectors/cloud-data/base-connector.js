'use strict';

function assertNonEmpty(value, name) {
  if (value == null || String(value).trim() === '') {
    throw new Error(`${name} is required.`);
  }
  return String(value).trim();
}

function normalizeBaseUrl(value, name = 'baseUrl') {
  return assertNonEmpty(value, name).replace(/\/+$/, '');
}

async function readJsonResponse(response, context) {
  let payload;
  try {
    payload = await response.json();
  } catch (_err) {
    payload = null;
  }
  if (!response.ok) {
    const message = payload && (payload.message || payload.error || payload.error_message)
      ? (payload.message || payload.error || payload.error_message)
      : `${context} failed with status ${response.status}`;
    throw new Error(String(message));
  }
  return payload;
}

function quoteIdentifier(identifier) {
  const value = assertNonEmpty(identifier, 'identifier');
  return `"${value.replace(/"/g, '""')}"`;
}

function flattenCoordinates(input, output = []) {
  if (!Array.isArray(input)) return output;
  if (input.length >= 2 && Number.isFinite(input[0]) && Number.isFinite(input[1])) {
    output.push([Number(input[0]), Number(input[1])]);
    return output;
  }
  input.forEach((value) => flattenCoordinates(value, output));
  return output;
}

function computeBoundingBox(features) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  (features || []).forEach((feature) => {
    const coordinates = feature && feature.geometry ? feature.geometry.coordinates : null;
    flattenCoordinates(coordinates).forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  return Number.isFinite(minX) ? [minX, minY, maxX, maxY] : null;
}

function rowsToGeoJSON(rows, options = {}) {
  const geometryColumn = options.geometryColumn || 'geometry';
  const longitudeColumn = options.longitudeColumn || 'longitude';
  const latitudeColumn = options.latitudeColumn || 'latitude';
  const idColumn = options.idColumn || null;

  const features = (rows || []).map((row, index) => {
    let geometry = null;
    const rawGeometry = row ? row[geometryColumn] : null;
    if (rawGeometry && typeof rawGeometry === 'object') {
      geometry = rawGeometry.type === 'Feature' ? rawGeometry.geometry : rawGeometry;
    } else if (typeof rawGeometry === 'string') {
      try {
        const parsed = JSON.parse(rawGeometry);
        geometry = parsed.type === 'Feature' ? parsed.geometry : parsed;
      } catch (_err) {
        geometry = null;
      }
    }
    if (!geometry && row && Number.isFinite(Number(row[longitudeColumn])) && Number.isFinite(Number(row[latitudeColumn]))) {
      geometry = { type: 'Point', coordinates: [Number(row[longitudeColumn]), Number(row[latitudeColumn])] };
    }
    const properties = { ...(row || {}) };
    delete properties[geometryColumn];
    return {
      type: 'Feature',
      id: idColumn && row && row[idColumn] != null ? row[idColumn] : index,
      geometry,
      properties,
    };
  }).filter((feature) => feature.geometry);

  return {
    type: 'FeatureCollection',
    bbox: computeBoundingBox(features),
    features,
  };
}

module.exports = {
  assertNonEmpty,
  normalizeBaseUrl,
  readJsonResponse,
  quoteIdentifier,
  rowsToGeoJSON,
  computeBoundingBox,
};
