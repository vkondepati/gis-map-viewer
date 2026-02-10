// Renderer: minimal map app that loads GeoJSON via preload API and displays in Leaflet
let map, baseLayer, currentGeoJsonLayer;
let lastGeoJSONLoaded = null;
let lastGeoJSONSourceCRS = null;
let layers = []; // {id, name, layer, visible}
let layerIdSeq = 1;

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
  // create layer with pointToLayer to produce circleMarkers so symbology can be updated via setStyle
  const leafletLayer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      // use per-layer symbology if present, fallback to defaults
      const sym = getLayerSymDefaults() || { radius: 6, color: '#ff7800', fillColor: '#ff7800', weight: 2, fillOpacity: 0.7 };
      return L.circleMarker(latlng, {
        radius: sym.radius,
        color: sym.color,
        fillColor: sym.fillColor,
        weight: sym.weight,
        fillOpacity: sym.fillOpacity,
      });
    },
    style: (feature) => {
      const sym = getLayerSymDefaults() || { color: '#ff7800', weight: 2, fillOpacity: 0.7 };
      return { color: sym.color, weight: sym.weight, fillOpacity: sym.fillOpacity };
    },
    onEachFeature: (feature, layer) => {
      let info = '<pre>' + JSON.stringify(feature.properties || {}, null, 2) + '</pre>';
      layer.bindPopup(info);
    },
  }).addTo(map);

  // Fit to layer bounds if available
  try {
    const bounds = leafletLayer.getBounds();
    if (bounds.isValid && bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  } catch (e) {
    // ignore
  }

  const id = 'layer-' + layerIdSeq++;
  layers.push({ id, name: name || 'Layer ' + id, layer: leafletLayer, visible: true, geojson });

  // add to layer list (TOC) with checkbox
  const li = document.createElement('li');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = true;
  cb.dataset.layerId = id;
  cb.addEventListener('change', (ev) => {
    toggleLayerVisibility(ev.target.dataset.layerId, ev.target.checked);
  });
  // symbol swatch
  const sw = document.createElement('div');
  sw.className = 'sym-swatch';
  sw.dataset.layerId = id;
  // default symbology (points use radius,color)
  const defaultSym = { color: '#ff7800', fillColor: '#ff7800', radius: 6, weight: 2, fillOpacity: 0.7 };
  entrySetSymDefaults(id, defaultSym);
  applySymToSwatch(sw, defaultSym);
  sw.addEventListener('click', (e) => showSymEditor(e.target.dataset.layerId, li));

  const lbl = document.createElement('span');
  lbl.textContent = name || id;
  li.appendChild(cb);
  li.appendChild(sw);
  li.appendChild(lbl);
  document.getElementById('layer-list').appendChild(li);

  // populate attribute table for the last loaded geojson
  lastGeoJSONLoaded = geojson;
  renderAttributeTable(geojson);
}

// symbology store per-layer
const layerSym = {};
function entrySetSymDefaults(id, sym) {
  layerSym[id] = Object.assign({}, sym);
}
function getLayerSymDefaults(id) {
  if (!id) return null;
  return layerSym[id] || null;
}
function applySymToSwatch(swatchEl, sym) {
  if (!swatchEl) return;
  swatchEl.style.background = sym.fillColor || sym.color || '#888';
}

function applySymbologyToLayer(id) {
  const entry = layers.find((l) => l.id === id);
  if (!entry) return;
  const sym = layerSym[id];
  if (!sym) return;
  // iterate over each child layer
  entry.layer.eachLayer((ly) => {
    // path layers (LineString/Polygon) support setStyle
    if (typeof ly.setStyle === 'function') {
      ly.setStyle({ color: sym.color, weight: sym.weight, fillColor: sym.fillColor, fillOpacity: sym.fillOpacity });
    }
    // circleMarker supports setRadius via setStyle in Leaflet v1.x
    if (ly.setRadius) {
      try { ly.setStyle({ radius: sym.radius, color: sym.color, fillColor: sym.fillColor, weight: sym.weight, fillOpacity: sym.fillOpacity }); } catch (e) {}
    }
  });
}

function showSymEditor(id, liElement) {
  // remove existing editor if present
  const existing = document.getElementById('sym-editor-' + id);
  if (existing) { existing.remove(); return; }
  const sym = layerSym[id] || { color: '#ff7800', fillColor: '#ff7800', radius: 6, weight: 2, fillOpacity: 0.7 };
  const editor = document.createElement('div');
  editor.id = 'sym-editor-' + id;
  editor.className = 'sym-editor';
  editor.innerHTML = `
    <label>Color: <input type="color" id="sym-color-${id}" value="${sym.color}" /></label>
    <label>Fill Color: <input type="color" id="sym-fill-${id}" value="${sym.fillColor||sym.color}" /></label>
    <label>Radius: <input type="number" id="sym-radius-${id}" value="${sym.radius}" min="1" /></label>
    <label>Weight: <input type="number" id="sym-weight-${id}" value="${sym.weight}" min="0"/></label>
    <label>Fill opacity: <input type="range" id="sym-fillop-${id}" value="${sym.fillOpacity}" min="0" max="1" step="0.05"/></label>
    <div style="display:flex;gap:8px;margin-top:8px"><button id="sym-apply-${id}">Apply</button><button id="sym-close-${id}">Close</button></div>
  `;
  liElement.appendChild(editor);
  document.getElementById(`sym-apply-${id}`).addEventListener('click', () => {
    const newSym = {
      color: document.getElementById(`sym-color-${id}`).value,
      fillColor: document.getElementById(`sym-fill-${id}`).value,
      radius: Number(document.getElementById(`sym-radius-${id}`).value),
      weight: Number(document.getElementById(`sym-weight-${id}`).value),
      fillOpacity: Number(document.getElementById(`sym-fillop-${id}`).value),
    };
    layerSym[id] = newSym;
    // update swatch
    const sw = liElement.querySelector('.sym-swatch');
    applySymToSwatch(sw, newSym);
    // apply to leaflet layer
    applySymbologyToLayer(id);
  });
  document.getElementById(`sym-close-${id}`).addEventListener('click', () => editor.remove());
}

function toggleLayerVisibility(id, visible) {
  const entry = layers.find((l) => l.id === id);
  if (!entry) return;
  if (visible) {
    entry.layer.addTo(map);
    entry.visible = true;
  } else {
    map.removeLayer(entry.layer);
    entry.visible = false;
  }
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

  // connection controls: connect button will either open file (file mode) or attempt warehouse connect (stub)
  document.getElementById('connect-btn').addEventListener('click', async () => {
    const mode = document.getElementById('connection-select').value;
    if (mode === 'file') {
      document.getElementById('open-btn').click();
      return;
    }
    const conn = document.getElementById('conn-string').value || '(no params)';
    await connectToWarehouse(mode, conn);
  });

  document.getElementById('connection-select').addEventListener('change', (ev) => {
    const mode = ev.target.value;
    // show/hide open button and placeholder
    if (mode === 'file') {
      document.getElementById('open-btn').style.display = 'inline-block';
      document.getElementById('conn-string').style.display = 'none';
      document.getElementById('connect-btn').textContent = 'Open';
    } else {
      document.getElementById('open-btn').style.display = 'none';
      document.getElementById('conn-string').style.display = 'inline-block';
      document.getElementById('connect-btn').textContent = 'Connect';
    }
  });

  // initialize connections UI
  document.getElementById('connection-select').dispatchEvent(new Event('change'));

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

async function connectToWarehouse(mode, connStr) {
  // Stub connector: in a real app this would open a connection and run a query.
  // For now simulate by adding a small sample GeoJSON layer with name indicating the source.
  const sample = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { source: mode, conn: connStr, id: 1 }, geometry: { type: 'Point', coordinates: [0, 0] } },
      { type: 'Feature', properties: { source: mode, conn: connStr, id: 2 }, geometry: { type: 'Point', coordinates: [10, 10] } },
    ],
  };
  const transformed = reprojectGeoJSON(sample, 'EPSG:4326', 'EPSG:3857');
  addGeoJSONLayer(transformed, `${mode} (${connStr})`);
  alert(`Connected to ${mode} (simulated) — sample layer added`);
}
