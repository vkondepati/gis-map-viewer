// Renderer: minimal map app that loads GeoJSON via preload API and displays in Leaflet
let map, baseLayer, currentGeoJsonLayer;
let lastGeoJSONLoaded = null;
let lastGeoJSONSourceCRS = null;

// Helper: normalize CRS string like 'EPSG:4326' or 'urn:ogc:def:crs:EPSG::4326'
function normalizeCRSName(name) {
  if (!name) return null;
  const m = name.match(/EPSG(?::|::)?(\d+)|EPSG:(\d+)/i);
  if (m) return 'EPSG:' + (m[1] || m[2]);
  // already in EPSG:#### form?
  if (/^EPSG:\d+/i.test(name)) return name.toUpperCase();
  return name;
}

// Reproject a GeoJSON object from `fromCRS` to `toCRS` (default map CRS: EPSG:3857)
function reprojectGeoJSON(geojson, fromCRS, toCRS = 'EPSG:3857') {
  if (!fromCRS || fromCRS === toCRS) return geojson;
  // ensure proj4 is available
  if (typeof proj4 !== 'function') return geojson;

  function transformCoords(coords) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      // proj4 expects [lon, lat]
      const out = proj4(fromCRS, toCRS, coords);
      return out;
    }
    return coords.map(transformCoords);
  }

  function transformGeometry(geom) {
    if (!geom) return geom;
    const g = Object.assign({}, geom);
    if (g.type === 'Point' || g.type === 'MultiPoint' || g.type === 'LineString' || g.type === 'MultiLineString' || g.type === 'Polygon' || g.type === 'MultiPolygon') {
      g.coordinates = transformCoords(g.coordinates);
      return g;
    }
    if (g.type === 'GeometryCollection') {
      g.geometries = g.geometries.map(transformGeometry);
      return g;
    }
    return g;
  }

  // Deep clone to avoid mutating original
  const clone = JSON.parse(JSON.stringify(geojson));

  if (clone.type === 'FeatureCollection') {
    clone.features = clone.features.map((f) => {
      const nf = Object.assign({}, f);
      nf.geometry = transformGeometry(f.geometry);
      return nf;
    });
    return clone;
  }

  if (clone.type === 'Feature') {
    clone.geometry = transformGeometry(clone.geometry);
    return clone;
  }

  // raw geometry
  return transformGeometry(clone);
}

function createMap(crs) {
  // Destroy existing map if any
  if (map) {
    map.remove();
    map = null;
  }

  // For simplicity we use standard CRS handling: Leaflet default (EPSG:3857)
  map = L.map('map', { center: [0, 0], zoom: 2 });
  baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
}

function addGeoJSONLayer(geojson, name) {
  if (currentGeoJsonLayer) map.removeLayer(currentGeoJsonLayer);
  currentGeoJsonLayer = L.geoJSON(geojson, {
    style: { color: '#ff7800', weight: 2 },
    onEachFeature: (feature, layer) => {
      let info = '<pre>' + JSON.stringify(feature.properties || {}, null, 2) + '</pre>';
      layer.bindPopup(info);
    },
  }).addTo(map);

  // Fit to layer bounds if available
  try {
    const bounds = currentGeoJsonLayer.getBounds();
    if (bounds.isValid && bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  } catch (e) {
    // ignore
  }

  // add to layer list
  const li = document.createElement('li');
  li.textContent = name || 'GeoJSON layer';
  document.getElementById('layer-list').appendChild(li);
}

window.addEventListener('DOMContentLoaded', () => {
  createMap('EPSG:3857');

  document.getElementById('open-btn').addEventListener('click', async () => {
    const res = await window.electronAPI.openGeoJSON();
    if (res && !res.canceled) {
      try {
        const parsed = JSON.parse(res.content);

        // Determine source CRS: prefer GeoJSON `crs` member if present, else use user-selected CRS
        let sourceCrs = null;
        if (parsed.crs && parsed.crs.properties && parsed.crs.properties.name) {
          sourceCrs = normalizeCRSName(parsed.crs.properties.name);
        }
        if (!sourceCrs) {
          sourceCrs = document.getElementById('crs-select').value || 'EPSG:4326';
        }
        lastGeoJSONLoaded = parsed;
        lastGeoJSONSourceCRS = sourceCrs;

        const transformed = reprojectGeoJSON(parsed, sourceCrs, 'EPSG:3857');
        addGeoJSONLayer(transformed, res.path.split(/[\\/]/).pop());
      } catch (err) {
        alert('Failed to parse GeoJSON: ' + err.message);
      }
    }
  });

  document.getElementById('crs-select').addEventListener('change', (ev) => {
    const selected = ev.target.value;
    // Recreate the map (Leaflet uses EPSG:3857) but allow reprojection of loaded GeoJSON
    createMap('EPSG:3857');
    if (lastGeoJSONLoaded) {
      // Reproject from user-selected source CRS to map CRS
      const transformed = reprojectGeoJSON(lastGeoJSONLoaded, selected, 'EPSG:3857');
      addGeoJSONLayer(transformed, 'reprojected');
    }
  });
});
