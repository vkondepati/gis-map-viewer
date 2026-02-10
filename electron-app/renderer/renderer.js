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

  // populate attribute table for the loaded geojson
  renderAttributeTable(geojson);
}

function renderAttributeTable(geojson) {
  const tbody = document.getElementById('attr-tbody');
  const thead = document.getElementById('attr-thead');
  tbody.innerHTML = '';
  thead.innerHTML = '';
  if (!geojson || !geojson.features || geojson.features.length === 0) return;

  // collect union of property keys
  const keys = new Set();
  geojson.features.forEach((f) => {
    const p = f.properties || {};
    Object.keys(p).forEach((k) => keys.add(k));
  });
  const keyList = Array.from(keys);

  // header
  const headerRow = document.createElement('tr');
  const idxTh = document.createElement('th');
  idxTh.textContent = '#';
  headerRow.appendChild(idxTh);
  keyList.forEach((k) => {
    const th = document.createElement('th');
    th.textContent = k;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // rows
  geojson.features.forEach((f, i) => {
    const tr = document.createElement('tr');
    const idxTd = document.createElement('td');
    idxTd.textContent = i + 1;
    tr.appendChild(idxTd);
    keyList.forEach((k) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      const val = f.properties && f.properties[k] !== undefined ? String(f.properties[k]) : '';
      td.textContent = val;
      td.dataset.key = k;
      td.dataset.index = i;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // show table
  document.getElementById('attribute-table').style.display = 'block';
}

async function applyAttributeEdits() {
  if (!lastGeoJSONLoaded || !lastGeoJSONLoaded.features) return;
  const tbody = document.getElementById('attr-tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach((tr) => {
    const index = parseInt(tr.querySelector('td').textContent, 10) - 1;
    const tds = Array.from(tr.querySelectorAll('td')).slice(1);
    tds.forEach((td) => {
      const key = td.dataset.key;
      const val = td.textContent;
      if (!lastGeoJSONLoaded.features[index].properties) lastGeoJSONLoaded.features[index].properties = {};
      // Attempt to parse JSON values (numbers, objects), fallback to string
      let parsed = val;
      try { parsed = JSON.parse(val); } catch (e) { parsed = val; }
      lastGeoJSONLoaded.features[index].properties[key] = parsed;
    });
  });

  // reproject from known source CRS to map CRS before adding
  const transformed = reprojectGeoJSON(lastGeoJSONLoaded, lastGeoJSONSourceCRS || document.getElementById('crs-select').value, 'EPSG:3857');
  addGeoJSONLayer(transformed, 'edited');
}

async function exportGeoJSON() {
  if (!lastGeoJSONLoaded) { alert('No GeoJSON loaded'); return; }
  const content = JSON.stringify(lastGeoJSONLoaded, null, 2);
  const defaultName = 'export.geojson';
  const res = await window.electronAPI.saveGeoJSON(defaultName, content);
  if (res && !res.canceled) {
    alert('Saved to: ' + res.path);
  } else if (res && res.error) {
    alert('Save failed: ' + res.error);
  }
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
  // wire attribute table buttons
  document.getElementById('toggle-attr').addEventListener('click', () => {
    const el = document.getElementById('attribute-table');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('apply-attr-btn').addEventListener('click', () => applyAttributeEdits());
  document.getElementById('export-btn').addEventListener('click', () => exportGeoJSON());
});
