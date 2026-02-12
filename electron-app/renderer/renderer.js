// Renderer: minimal map app that loads GeoJSON via preload API and displays in Leaflet
let map, baseLayer, currentGeoJsonLayer;
let lastGeoJSONLoaded = null;
let lastGeoJSONSourceCRS = null;
let layers = []; // {id, name, layer, visible, geojson, geometryType}
let layerIdSeq = 1;
let activeLayerId = null;
const dirtyLayerIds = new Set();

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

function markLayerDirty(layerId, isDirty = true) {
  if (!layerId) return;
  if (isDirty) dirtyLayerIds.add(layerId);
  else dirtyLayerIds.delete(layerId);
  refreshLayerListState();
}

function refreshLayerListState() {
  const listItems = document.querySelectorAll('#layer-list li[data-layer-id]');
  listItems.forEach((li) => {
    const layerId = li.dataset.layerId;
    li.classList.toggle('active-layer', layerId === activeLayerId);
    li.classList.toggle('dirty-layer', dirtyLayerIds.has(layerId));
  });
}

function getActiveLayerEntry() {
  if (!activeLayerId) return null;
  return layers.find((entry) => entry.id === activeLayerId) || null;
}

async function saveLayerToFile(layerId) {
  const entry = layers.find((l) => l.id === layerId);
  if (!entry || !entry.geojson) return false;
  const content = JSON.stringify(entry.geojson, null, 2);
  const defaultName = `${entry.name || 'layer'}.geojson`;
  const res = await window.electronAPI.saveGeoJSON(defaultName, content);
  if (res && !res.canceled) {
    markLayerDirty(layerId, false);
    return true;
  }
  if (res && res.error) {
    alert('Save failed: ' + res.error);
  }
  return false;
}

async function setActiveLayer(layerId, options = {}) {
  const { promptForSave = true } = options;
  if (!layerId || activeLayerId === layerId) return true;
  const previousLayerId = activeLayerId;

  if (promptForSave && previousLayerId && dirtyLayerIds.has(previousLayerId)) {
    const saveFirst = confirm('Active layer has unsaved edits. Click OK to save before switching layers.');
    if (saveFirst) {
      const saved = await saveLayerToFile(previousLayerId);
      if (!saved) return false;
    } else {
      const continueWithoutSaving = confirm('Switch without saving edits? Click OK to switch, Cancel to stay on the current layer.');
      if (!continueWithoutSaving) return false;
    }
  }

  activeLayerId = layerId;
  refreshLayerListState();
  return true;
}

// Helper function to detect if coordinates are likely swapped (lat/lon vs lon/lat)
function detectSwappedCoordinates(geojson) {
  const coords = [];
  
  function collectCoords(obj) {
    if (Array.isArray(obj)) {
      if (typeof obj[0] === 'number' && typeof obj[1] === 'number') {
        coords.push(obj);
      } else {
        obj.forEach(collectCoords);
      }
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(collectCoords);
    }
  }
  
  collectCoords(geojson);
  
  if (coords.length === 0) return false;
  
  // Get bounds
  let minX = coords[0][0], maxX = coords[0][0];
  let minY = coords[0][1], maxY = coords[0][1];
  
  coords.forEach(c => {
    minX = Math.min(minX, c[0]);
    maxX = Math.max(maxX, c[0]);
    minY = Math.min(minY, c[1]);
    maxY = Math.max(maxY, c[1]);
  });
  
  // If X is in -90..90 range (typical latitude) and Y is in -180..180+ (typical longitude), swap is likely needed
  // But only if the first coordinate looks like latitude and second like longitude
  const xLooksLikeLatitude = minX >= -90 && maxX <= 90;
  const yLooksLikeLongitude = minY >= -180 && maxY <= 180;
  
  return xLooksLikeLatitude && yLooksLikeLongitude;
}

// Reproject a GeoJSON object from `fromCRS` to `toCRS` (default map CRS: EPSG:3857)
function reprojectGeoJSON(geojson, fromCRS, toCRS = 'EPSG:3857', swapCoords = false) {
  if (!fromCRS || fromCRS === toCRS) {
    // Still swap if requested even without reprojection
    if (!swapCoords) return geojson;
    return swapGeoJSONCoordinates(geojson);
  }
  // ensure proj4 is available
  if (typeof proj4 !== 'function') return geojson;

  function transformCoords(coords) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      // If swapping is requested, swap before projecting
      let workingCoords = swapCoords ? [coords[1], coords[0]] : coords;
      // proj4 expects [lon, lat]
      const out = proj4(fromCRS, toCRS, workingCoords);
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

// Helper function to swap coordinates in GeoJSON (convert [lat, lon] to [lon, lat])
function swapGeoJSONCoordinates(geojson) {
  function swapCoords(coords) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords[1], coords[0]];
    }
    return coords.map(swapCoords);
  }

  function swapGeometry(geom) {
    if (!geom) return geom;
    const g = Object.assign({}, geom);
    if (g.type === 'Point' || g.type === 'MultiPoint' || g.type === 'LineString' || g.type === 'MultiLineString' || g.type === 'Polygon' || g.type === 'MultiPolygon') {
      g.coordinates = swapCoords(g.coordinates);
      return g;
    }
    if (g.type === 'GeometryCollection') {
      g.geometries = g.geometries.map(swapGeometry);
      return g;
    }
    return g;
  }

  const clone = JSON.parse(JSON.stringify(geojson));

  if (clone.type === 'FeatureCollection') {
    clone.features = clone.features.map((f) => {
      const nf = Object.assign({}, f);
      nf.geometry = swapGeometry(f.geometry);
      return nf;
    });
    return clone;
  }

  if (clone.type === 'Feature') {
    clone.geometry = swapGeometry(clone.geometry);
    return clone;
  }

  return swapGeometry(clone);
}

function createMap(crs) {
  // Destroy existing map if any
  if (map) {
    map.remove();
    map = null;
  }

  // For simplicity we use standard CRS handling: Leaflet default (EPSG:3857)
  map = L.map('map', { center: [0, 0], zoom: 2 });
  window.map = map;
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
  currentGeoJsonLayer = leafletLayer;

  // Fit to layer bounds if available
  try {
    const bounds = leafletLayer.getBounds();
    if (bounds.isValid && bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  } catch (e) {
    // ignore
  }

  const id = 'layer-' + layerIdSeq++;
  const geometryType = inferGeometryTypeFromGeoJSON(geojson, 'Point');
  layers.push({ id, name: name || 'Layer ' + id, layer: leafletLayer, visible: true, geojson, geometryType });
  activeLayerId = id;

  // add to layer list (TOC) with checkbox
  const li = document.createElement('li');
  li.dataset.layerId = id;
  li.classList.toggle('active-layer', id === activeLayerId);
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
  lbl.className = 'layer-name';
  lbl.textContent = name || id;
  li.appendChild(cb);
  li.appendChild(sw);
  li.appendChild(lbl);

  li.addEventListener('click', async (e) => {
    if (e.target && e.target.closest('input[type="checkbox"], .sym-swatch')) return;
    const switched = await setActiveLayer(id);
    if (!switched) return;
    const entry = layers.find((layerEntry) => layerEntry.id === id);
    if (entry) {
      lastGeoJSONLoaded = entry.geojson;
      currentGeoJsonLayer = entry.layer;
      renderAttributeTable(entry.geojson);
    }
  });
  
  // Add right-click context menu for layer labels
  li.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showLayerContextMenu(id, geojson, e);
  });
  
  document.getElementById('layer-list').appendChild(li);

  // populate attribute table for the last loaded geojson
  lastGeoJSONLoaded = geojson;
  renderAttributeTable(geojson);
  refreshLayerListState();
}

// Layer label context menu
function showLayerContextMenu(layerId, geojson, event) {
  const menu = document.getElementById('layer-context-menu');
  const container = document.getElementById('label-options-container');
  container.innerHTML = '';
  
  // Get column names from geojson features
  const columns = geojson.features && geojson.features.length > 0 
    ? Object.keys(geojson.features[0].properties || {})
    : [];
  
  // Add "None" option
  const noneBtn = document.createElement('button');
  noneBtn.textContent = 'No Labels';
  noneBtn.addEventListener('click', () => {
    removeLayerLabels(layerId);
    menu.style.display = 'none';
  });
  container.appendChild(noneBtn);
  
  if (columns.length > 0) {
    const sep = document.createElement('div');
    sep.style.borderTop = '1px solid #366b94';
    sep.style.margin = '0';
    container.appendChild(sep);
  }
  
  // Add column options
  columns.forEach(col => {
    const btn = document.createElement('button');
    btn.textContent = col;
    btn.addEventListener('click', () => {
      displayLayerLabels(layerId, col, geojson);
      menu.style.display = 'none';
    });
    container.appendChild(btn);
  });
  
  // Position menu
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  menu.style.display = 'block';
}

// Store for layer labels
const layerLabels = {};

// Display labels on map for a layer based on column
function displayLayerLabels(layerId, columnName, geojson) {
  const layer = layers.find(l => l.id === layerId);
  if (!layer) return;
  
  removeLayerLabels(layerId);
  layerLabels[layerId] = { columnName, geojson };
  
  geojson.features.forEach((feature, idx) => {
    const value = feature.properties ? feature.properties[columnName] : '';
    if (value && feature.geometry && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates;
      let latLng;
      if (feature.geometry.type === 'Point') {
        latLng = L.latLng(coords[1], coords[0]);
      } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'Polygon') {
        // For lines/polygons, label at first coordinate
        const first = coords[0];
        latLng = L.latLng(first[1], first[0]);
      }
      
      if (latLng) {
        const marker = L.marker(latLng, {
          icon: L.divIcon({
            className: 'label-marker',
            html: '<div style="background:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;box-shadow:0 1px 3px rgba(0,0,0,0.3)">' + value + '</div>',
            iconSize: null,
            iconAnchor: null
          })
        }).addTo(map);
        marker.layerId = layerId;
      }
    }
  });
}

// Remove labels for a layer
function removeLayerLabels(layerId) {
  delete layerLabels[layerId];
  // Remove all marker labels for this layer
  map.eachLayer((layer) => {
    if (layer.layerId === layerId && layer.setIcon) {
      map.removeLayer(layer);
    }
  });
}

// Close context menu on document click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('layer-context-menu');
  if (!e.target.closest('#layer-context-menu') && !e.target.closest('#layer-list')) {
    menu.style.display = 'none';
  }
});

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
    // === Layers Menu ===
    const btnLayers = document.getElementById('btn-layers');
    const layersDropdown = document.getElementById('layers-dropdown');
    const dialogCreateLayer = document.getElementById('dialog-create-layer');
    const dialogRenameLayer = document.getElementById('dialog-rename-layer');
    const dialogDrawOrder = document.getElementById('dialog-draworder');
    let renameLayerTargetId = null;

    // Dropdown toggle for Layers
    if (btnLayers && layersDropdown) {
      btnLayers.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        layersDropdown.style.display = (layersDropdown.style.display === 'block') ? 'none' : 'block';
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#layers-menu')) layersDropdown.style.display = 'none';
      });
    }

    // Handle Layers dropdown actions
    if (layersDropdown) {
      layersDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const action = item.dataset.layerAction;
          layersDropdown.style.display = 'none';
          switch(action) {
            case 'create': showModal('dialog-create-layer'); break;
            case 'save': saveLayersToFile(); break;
            case 'load': loadLayersFromFile(); break;
            case 'draworder': showDrawOrderDialog(); break;
          }
        });
      });
    }

    // Create Layer dialog logic
    if (dialogCreateLayer) {
      document.getElementById('create-layer-ok').onclick = function() {
        const name = document.getElementById('create-layer-name').value || 'New Layer';
        const geomType = document.getElementById('create-layer-geometry').value;
        createEmptyLayer(name, geomType);
        hideModal('dialog-create-layer');
      };
      document.getElementById('create-layer-cancel').onclick = function() {
        hideModal('dialog-create-layer');
      };
    }

    // Rename Layer dialog logic
    if (dialogRenameLayer) {
      document.getElementById('rename-layer-ok').onclick = function() {
        const newName = document.getElementById('rename-layer-name').value;
        if (renameLayerTargetId && newName) renameLayer(renameLayerTargetId, newName);
        hideModal('dialog-rename-layer');
      };
      document.getElementById('rename-layer-cancel').onclick = function() {
        hideModal('dialog-rename-layer');
      };
    }

    // Draw Order dialog logic
    if (dialogDrawOrder) {
      document.getElementById('draworder-ok').onclick = function() {
        applyDrawOrder();
        hideModal('dialog-draworder');
      };
      document.getElementById('draworder-cancel').onclick = function() {
        hideModal('dialog-draworder');
      };
    }

    // Add context menu for renaming/removing layers in TOC
    document.getElementById('layer-list').addEventListener('contextmenu', function(e) {
      const li = e.target.closest('li');
      if (!li) return;
      e.preventDefault();
      const layerId = li.querySelector('input[type="checkbox"]').dataset.layerId;
      showLayerTocContextMenu(layerId, e.clientX, e.clientY);
    });

    // Layer TOC context menu
    function showLayerTocContextMenu(layerId, x, y) {
      let menu = document.getElementById('layer-toc-context-menu');
      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'layer-toc-context-menu';
        menu.className = 'context-menu';
        menu.innerHTML = `
          <button id="toc-rename">Rename Layer</button>
          <button id="toc-remove">Remove Layer</button>
        `;
        document.body.appendChild(menu);
      }
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
      menu.style.display = 'block';
      menu.onclick = (ev) => { ev.stopPropagation(); };
      document.getElementById('toc-rename').onclick = function() {
        renameLayerTargetId = layerId;
        showModal('dialog-rename-layer');
        menu.style.display = 'none';
      };
      document.getElementById('toc-remove').onclick = function() {
        removeLayer(layerId);
        menu.style.display = 'none';
      };
      document.addEventListener('click', function hideMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', hideMenu);
      });
    }

    // Draw Order dialog logic
    function showDrawOrderDialog() {
      const list = document.getElementById('draworder-list');
      list.innerHTML = '';
      layers.forEach(l => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.layerId = l.id;
        li.innerHTML = `<span class="drag-handle">☰</span> ${l.name}`;
        list.appendChild(li);
      });
      // Drag and drop logic
      let dragSrc = null;
      list.querySelectorAll('li').forEach(li => {
        li.addEventListener('dragstart', function(e) {
          dragSrc = li;
          li.style.opacity = 0.5;
        });
        li.addEventListener('dragend', function(e) {
          li.style.opacity = '';
          dragSrc = null;
        });
        li.addEventListener('dragover', function(e) {
          e.preventDefault();
        });
        li.addEventListener('drop', function(e) {
          e.preventDefault();
          if (dragSrc && dragSrc !== li) {
            list.insertBefore(dragSrc, li.nextSibling);
          }
        });
      });
      showModal('dialog-draworder');
    }

    function applyDrawOrder() {
      const list = document.getElementById('draworder-list');
      const newOrder = Array.from(list.children).map(li => li.dataset.layerId);
      // Reorder layers array and map layers
      layers.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      // Remove all layers from map and re-add in new order
      layers.forEach(l => { if (l.layer) l.layer.remove(); });
      layers.forEach(l => { if (l.layer) l.layer.addTo(map); });
      // Re-render TOC
      renderLayerList();
    }

    // Save/load layers (GeoJSON collection)
    function saveLayersToFile() {
      const geojson = {
        type: 'FeatureCollection',
        features: layers.flatMap(l => l.geojson && l.geojson.features ? l.geojson.features : [])
      };
      const blob = new Blob([JSON.stringify(geojson, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'layers.geojson';
      a.click();
      URL.revokeObjectURL(url);
      dirtyLayerIds.clear();
      refreshLayerListState();
    }

    function loadLayersFromFile() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.geojson,.json,application/geo+json';
      input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
          try {
            const geojson = JSON.parse(ev.target.result);
            if (geojson.type === 'FeatureCollection') {
              createEmptyLayer(file.name.replace(/\.[^/.]+$/, ''), geojson.features[0]?.geometry?.type || 'Point', geojson);
            }
          } catch (err) {
            alert('Failed to load GeoJSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    // Create empty layer
    function createEmptyLayer(name, geomType, geojson) {
      const id = 'layer-' + layerIdSeq++;
      const newGeojson = geojson || { type: 'FeatureCollection', features: [] };
      const leafletLayer = L.geoJSON(newGeojson).addTo(map);
      const geometryType = normalizeGeometryType(geomType || inferGeometryTypeFromGeoJSON(newGeojson, 'Point'));
      layers.push({ id, name, layer: leafletLayer, visible: true, geojson: newGeojson, geometryType });
      if (!layerSym[id]) {
        entrySetSymDefaults(id, { color: '#ff7800', fillColor: '#ff7800', radius: 6, weight: 2, fillOpacity: 0.7 });
      }
      activeLayerId = id;
      renderLayerList();
    }

    // Rename layer
    function renameLayer(layerId, newName) {
      const l = layers.find(l => l.id === layerId);
      if (l) { l.name = newName; renderLayerList(); }
    }

    // Remove layer
    function removeLayer(layerId) {
      const idx = layers.findIndex(l => l.id === layerId);
      if (idx !== -1) {
        if (activeLayerId === layerId) activeLayerId = null;
        dirtyLayerIds.delete(layerId);
        if (layers[idx].layer) layers[idx].layer.remove();
        layers.splice(idx, 1);
        if (!activeLayerId && layers.length > 0) activeLayerId = layers[layers.length - 1].id;
        renderLayerList();
      }
    }

    // Render TOC
    function renderLayerList() {
      const ul = document.getElementById('layer-list');
      ul.innerHTML = '';
      layers.forEach(l => {
        const li = document.createElement('li');
        li.dataset.layerId = l.id;
        li.classList.toggle('active-layer', l.id === activeLayerId);
        li.classList.toggle('dirty-layer', dirtyLayerIds.has(l.id));
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = l.visible;
        cb.dataset.layerId = l.id;
        cb.addEventListener('change', (ev) => {
          toggleLayerVisibility(ev.target.dataset.layerId, ev.target.checked);
        });
        const sw = document.createElement('div');
        sw.className = 'sym-swatch';
        sw.dataset.layerId = l.id;
        const sym = getLayerSymDefaults(l.id) || { color: '#ff7800', fillColor: '#ff7800', radius: 6, weight: 2, fillOpacity: 0.7 };
        applySymToSwatch(sw, sym);
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          showSymEditor(e.target.dataset.layerId, li);
        });
        const lbl = document.createElement('span');
        lbl.className = 'layer-name';
        lbl.textContent = l.name;
        li.appendChild(cb);
        li.appendChild(sw);
        li.appendChild(lbl);
        li.addEventListener('click', async (ev) => {
          if (ev.target && ev.target.closest('input[type="checkbox"], .sym-swatch')) return;
          const switched = await setActiveLayer(l.id);
          if (!switched) return;
          refreshAttributesForEntry(l);
          if (activeEditMode === 'add') startEditAdd();
        });
        ul.appendChild(li);
      });
      refreshLayerListState();
    }

    // Toggle layer visibility
    function toggleLayerVisibility(layerId, visible) {
      const l = layers.find(l => l.id === layerId);
      if (l) {
        l.visible = visible;
        if (l.layer) {
          if (visible) l.layer.addTo(map);
          else l.layer.remove();
        }
      }
    }
  console.log('=== DOM LOADED ===');
  console.log('All buttons:', {
    btnFile: document.getElementById('btn-file'),
    btnDuckdb: document.getElementById('btn-duckdb'),
    btnSnowflake: document.getElementById('btn-snowflake'),
    btnDatabricks: document.getElementById('btn-databricks'),
    btnIceberg: document.getElementById('btn-iceberg'),
  });
  
  console.log('All dialogs:', {
    file: document.getElementById('dialog-file'),
    duckdb: document.getElementById('dialog-duckdb'),
    snowflake: document.getElementById('dialog-snowflake'),
    databricks: document.getElementById('dialog-databricks'),
    iceberg: document.getElementById('dialog-iceberg'),
    overlay: document.getElementById('modal-overlay'),
  });

  createMap('EPSG:3857');
  console.log('Map created');

  // Wire up collapsible sections and panels
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sectionId = btn.dataset.section;
      const element = document.getElementById(sectionId);
      if (element) {
        element.classList.toggle('collapsed');
        btn.textContent = element.classList.contains('collapsed') ? '+' : '−';
      }
    });
  });

  // Expand attributes panel by default
  const attrPanel = document.getElementById('attributes-panel');
  if (attrPanel) {
    attrPanel.classList.remove('collapsed');
    const toggleBtn = attrPanel.querySelector('.toggle-btn');
    if (toggleBtn) toggleBtn.textContent = '−';
  }

  // Legacy open button (no longer in HTML, but kept as fallback)
  const openBtn = document.getElementById('open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', async () => {
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
  }

  // Helper function to show/hide modals
  function showModal(dialogId) {
    const overlay = document.getElementById('modal-overlay');
    const dialog = document.getElementById(dialogId);
    if (overlay && dialog) {
      overlay.classList.add('visible');
      dialog.classList.add('visible');
      dialog.classList.remove('modal-hidden');
    }
  }

  function hideModal(dialogId) {
    const overlay = document.getElementById('modal-overlay');
    const dialog = document.getElementById(dialogId);
    if (overlay && dialog) {
      overlay.classList.remove('visible');
      dialog.classList.remove('visible');
      dialog.classList.add('modal-hidden');
    }
  }

  // Close modal when clicking overlay
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      overlay.classList.remove('visible');
      document.querySelectorAll('.connection-dialog.visible').forEach(d => {
        d.classList.remove('visible');
        d.classList.add('modal-hidden');
      });
    });
  }

  // Toolbar: Connect + Navigate + Select + Edit + Analysis menus
  console.log('Setting up toolbar menus...');

  const btnConnect = document.getElementById('btn-connect');
  const connectDropdown = document.getElementById('connect-dropdown');
  const btnNavigate = document.getElementById('btn-navigate');
  const navigateDropdown = document.getElementById('navigate-dropdown');
  const btnSelect = document.getElementById('btn-select');
  const selectDropdown = document.getElementById('select-dropdown');
  const btnEdit = document.getElementById('btn-edit');
  const editDropdown = document.getElementById('edit-dropdown');
  const btnAnalysis = document.getElementById('btn-analysis');
  const analysisDropdown = document.getElementById('analysis-dropdown');
  const btnPrint = document.getElementById('btn-print');
  const dialogBuffer = document.getElementById('dialog-buffer');
  const bufferDistanceInput = document.getElementById('buffer-distance');
  const bufferUnitsSelect = document.getElementById('buffer-units');
  const bufferOkBtn = document.getElementById('buffer-ok');
  const bufferCancelBtn = document.getElementById('buffer-cancel');

  function wireDropdown(button, menu, menuSelector) {
    if (!button || !menu) return;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Close other dropdowns
      [connectDropdown, navigateDropdown, selectDropdown, editDropdown, analysisDropdown].forEach(d => {
        if (d && d !== menu) d.style.display = 'none';
      });
      menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest(menuSelector)) menu.style.display = 'none';
    });
  }

  wireDropdown(btnConnect, connectDropdown, '#connect-menu');
  wireDropdown(btnNavigate, navigateDropdown, '#navigate-menu');
  wireDropdown(btnSelect, selectDropdown, '#select-menu');
  wireDropdown(btnEdit, editDropdown, '#edit-menu');
  wireDropdown(btnAnalysis, analysisDropdown, '#analysis-menu');

  // Connect menu items
  if (connectDropdown) {
    connectDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const connType = item.dataset.conn;
        connectDropdown.style.display = 'none';
        const dialogMap = { 'file':'dialog-file','duckdb':'dialog-duckdb','snowflake':'dialog-snowflake','databricks':'dialog-databricks','iceberg':'dialog-iceberg' };
        showModal(dialogMap[connType]);
      });
    });
  }

  // Navigate, Select, Edit, and Analysis menu items
  [navigateDropdown, selectDropdown, editDropdown, analysisDropdown].forEach(dropdown => {
    if (dropdown) {
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const tool = item.dataset.tool;
          dropdown.style.display = 'none';
          console.log('Tool selected:', tool);
          // dispatch to handlers
          switch(tool) {
            case 'buffer': return handleBuffer();
            case 'intersect': return handleIntersect();
            case 'select-click': return startSelectByClick();
            case 'select-rect': return startSelectRectangle();
            case 'select-poly': return startSelectByPolygon();
            case 'select-line': return startSelectByLine();
            case 'nav-zoomin': return setNavigationMode('zoom-in');
            case 'nav-zoomout': return setNavigationMode('zoom-out');
            case 'nav-pan': return setNavigationMode('pan');
            case 'nav-zoomselect': return setNavigationMode('zoom-to-select');
            case 'edit-add': return startEditAdd();
            case 'edit-modify': return startEditModify();
            case 'edit-delete': return startEditDelete();
            case 'update-attributes': return openAttributeUpdater();
          }
        });
      });
    }
  });

  // Print button
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      console.log('Print map requested');
      window.print();
    });
  }

  function collectBufferSourceFeatures() {
    if (selectedFeatureSet.size > 0) {
      return Array.from(selectedFeatureSet)
        .map((featureLayer) => JSON.parse(JSON.stringify(featureLayer.feature)))
        .filter((feature) => feature && feature.geometry);
    }

    const entry = getActiveLayerEntry();
    if (!entry || !entry.geojson || !Array.isArray(entry.geojson.features)) return [];
    return entry.geojson.features
      .map((feature) => JSON.parse(JSON.stringify(feature)))
      .filter((feature) => feature && feature.geometry);
  }

  function sampleCoords(geojson, limit = 120) {
    const out = [];
    function walk(obj) {
      if (!obj || out.length >= limit) return;
      if (Array.isArray(obj)) {
        if (obj.length >= 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number') {
          out.push([obj[0], obj[1]]);
          return;
        }
        obj.forEach(walk);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(walk);
      }
    }
    walk(geojson);
    return out;
  }

  function isLikelyGeographic(geojson) {
    const coords = sampleCoords(geojson);
    if (coords.length === 0) return true;
    const geographicCount = coords.filter(([x, y]) => Math.abs(x) <= 180 && Math.abs(y) <= 90).length;
    return geographicCount / coords.length >= 0.85;
  }

  function runBufferAnalysis(distance, units) {
    if (!window.turf || typeof turf.buffer !== 'function') {
      alert('Buffer library failed to load. Please restart the app and try again.');
      return;
    }
    if (!Number.isFinite(distance) || distance <= 0) {
      alert('Buffer value must be greater than 0.');
      return;
    }

    const sourceFeatures = collectBufferSourceFeatures();
    if (sourceFeatures.length === 0) {
      alert('No features available. Select features or activate a layer with data.');
      return;
    }

    const normalizedUnits = units || 'meters';
    const sourceCollection = {
      type: 'FeatureCollection',
      features: sourceFeatures,
    };
    const sourceIsGeographic = isLikelyGeographic(sourceCollection);
    let sourceCollectionForBuffer = sourceCollection;
    let convertBackToMercator = false;

    // If coordinates look projected (meters), convert to geographic before Turf buffer.
    if (!sourceIsGeographic) {
      convertBackToMercator = true;
      if (typeof turf.toWgs84 === 'function') {
        sourceCollectionForBuffer = turf.toWgs84(sourceCollection);
      } else {
        sourceCollectionForBuffer = reprojectGeoJSON(sourceCollection, 'EPSG:3857', 'EPSG:4326');
      }
    }

    const bufferedFeatures4326 = [];

    sourceCollectionForBuffer.features.forEach((feature, index) => {
      try {
        const buffered = turf.buffer(feature, distance, { units: normalizedUnits, steps: 64 });
        if (buffered && buffered.geometry) {
          buffered.properties = Object.assign({}, feature.properties || {}, {
            _buffer_distance: distance,
            _buffer_units: normalizedUnits,
            _buffer_source_index: index,
          });
          bufferedFeatures4326.push(buffered);
        }
      } catch (err) {
        console.warn('Buffer failed for feature index', index, err);
      }
    });

    if (bufferedFeatures4326.length === 0) {
      alert('Buffer operation failed for all features.');
      return;
    }

    let bufferedOutput = {
      type: 'FeatureCollection',
      features: bufferedFeatures4326,
    };

    // Preserve source coordinate space only if source was projected.
    if (convertBackToMercator) {
      if (typeof turf.toMercator === 'function') {
        bufferedOutput = turf.toMercator(bufferedOutput);
      } else {
        bufferedOutput = reprojectGeoJSON(bufferedOutput, 'EPSG:4326', 'EPSG:3857');
      }
    }

    const activeEntry = getActiveLayerEntry();
    const sourceName = (activeEntry && activeEntry.name) ? activeEntry.name : 'Selection';
    addGeoJSONLayer(bufferedOutput, `${sourceName} buffer (${distance} ${normalizedUnits})`);
  }

  function handleBuffer() {
    if (!dialogBuffer) {
      alert('Buffer dialog is unavailable.');
      return;
    }
    if (bufferDistanceInput) bufferDistanceInput.value = bufferDistanceInput.value || '100';
    if (bufferUnitsSelect && !bufferUnitsSelect.value) bufferUnitsSelect.value = 'meters';
    showModal('dialog-buffer');
  }

  if (bufferOkBtn) {
    bufferOkBtn.addEventListener('click', () => {
      const distance = Number(bufferDistanceInput ? bufferDistanceInput.value : '');
      const units = (bufferUnitsSelect ? bufferUnitsSelect.value : 'meters') || 'meters';
      hideModal('dialog-buffer');
      runBufferAnalysis(distance, units);
    });
  }

  if (bufferCancelBtn) {
    bufferCancelBtn.addEventListener('click', () => {
      hideModal('dialog-buffer');
    });
  }

  function handleIntersect() { alert('Intersect tool (placeholder)'); }

  // Selection tool logic
  const selectedFeatureSet = new Set();
  window.selectedFeatures = [];
  let activeSelectMode = null;
  let clickSelectHandler = null;
  let rectStart = null;
  let rectSketch = null;
  let rectClickHandler = null;
  let rectMoveHandler = null;
  let sketchVertices = [];
  let sketchGuide = null;
  let sketchResult = null;
  let polyClickHandler = null;
  let polyMoveHandler = null;
  let polyDoubleClickHandler = null;
  let lineClickHandler = null;
  let lineMoveHandler = null;
  let lineDoubleClickHandler = null;
  const SELECT_STYLE = { color: '#00d1ff', fillColor: '#00d1ff', weight: 3, fillOpacity: 0.9 };
  const SKETCH_STYLE = { color: '#6bd6ff', weight: 2, fillColor: '#6bd6ff', fillOpacity: 0.15, dashArray: '6,4' };

  function updateSelectedFeaturesWindow() {
    window.selectedFeatures = Array.from(selectedFeatureSet);
  }

  function flattenLatLngs(input, out = []) {
    if (!Array.isArray(input)) return out;
    input.forEach((item) => {
      if (Array.isArray(item)) flattenLatLngs(item, out);
      else if (item && typeof item.lat === 'number' && typeof item.lng === 'number') out.push(item);
    });
    return out;
  }

  function getFeatureLayers(includeHidden = true) {
    const out = [];
    layers.forEach((entry) => {
      if (!entry || !entry.layer) return;
      if (!includeHidden && !map.hasLayer(entry.layer)) return;
      if (typeof entry.layer.eachLayer !== 'function') return;
      entry.layer.eachLayer((child) => {
        if (child && child.feature) out.push(child);
      });
    });
    return out;
  }

  function getRepresentativePoints(featureLayer) {
    const pts = [];
    if (typeof featureLayer.getLatLng === 'function') pts.push(featureLayer.getLatLng());
    if (typeof featureLayer.getLatLngs === 'function') pts.push(...flattenLatLngs(featureLayer.getLatLngs()));
    if (typeof featureLayer.getBounds === 'function') {
      const b = featureLayer.getBounds();
      if (b && b.isValid && b.isValid()) {
        pts.push(b.getCenter(), b.getNorthWest(), b.getNorthEast(), b.getSouthWest(), b.getSouthEast());
      }
    }
    return pts.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }

  function highlightFeature(featureLayer) {
    if (!featureLayer.__originalStyle && featureLayer.options) {
      featureLayer.__originalStyle = {
        color: featureLayer.options.color,
        fillColor: featureLayer.options.fillColor,
        weight: featureLayer.options.weight,
        fillOpacity: featureLayer.options.fillOpacity,
        radius: featureLayer.options.radius,
      };
    }
    if (typeof featureLayer.setStyle === 'function') {
      const next = Object.assign({}, SELECT_STYLE);
      if (typeof featureLayer.options?.radius === 'number') next.radius = featureLayer.options.radius + 2;
      featureLayer.setStyle(next);
    }
  }

  function unhighlightFeature(featureLayer) {
    if (typeof featureLayer.setStyle !== 'function') return;
    if (featureLayer.__originalStyle) featureLayer.setStyle(featureLayer.__originalStyle);
  }

  function clearSelection() {
    selectedFeatureSet.forEach((ly) => unhighlightFeature(ly));
    selectedFeatureSet.clear();
    updateSelectedFeaturesWindow();
  }

  function setSelection(featureLayers) {
    clearSelection();
    featureLayers.forEach((ly) => {
      selectedFeatureSet.add(ly);
      highlightFeature(ly);
    });
    updateSelectedFeaturesWindow();
    console.log(`Selected ${selectedFeatureSet.size} feature(s)`);
  }

  function toggleSelection(featureLayer) {
    if (selectedFeatureSet.has(featureLayer)) {
      selectedFeatureSet.delete(featureLayer);
      unhighlightFeature(featureLayer);
    } else {
      selectedFeatureSet.add(featureLayer);
      highlightFeature(featureLayer);
    }
    updateSelectedFeaturesWindow();
    console.log(`Selected ${selectedFeatureSet.size} feature(s)`);
  }

  function cleanupSketchLayers() {
    if (rectSketch && map.hasLayer(rectSketch)) map.removeLayer(rectSketch);
    if (sketchGuide && map.hasLayer(sketchGuide)) map.removeLayer(sketchGuide);
    if (sketchResult && map.hasLayer(sketchResult)) map.removeLayer(sketchResult);
    rectSketch = null;
    sketchGuide = null;
    sketchResult = null;
    rectStart = null;
    sketchVertices = [];
  }

  function stopClickSelect() {
    if (!clickSelectHandler) return;
    getFeatureLayers(true).forEach((featureLayer) => featureLayer.off('click', clickSelectHandler));
    clickSelectHandler = null;
  }

  function stopRectangleSelect() {
    if (rectClickHandler) map.off('click', rectClickHandler);
    if (rectMoveHandler) map.off('mousemove', rectMoveHandler);
    rectClickHandler = null;
    rectMoveHandler = null;
    cleanupSketchLayers();
  }

  function stopPolygonSelect() {
    if (polyClickHandler) map.off('click', polyClickHandler);
    if (polyMoveHandler) map.off('mousemove', polyMoveHandler);
    if (polyDoubleClickHandler) map.off('dblclick', polyDoubleClickHandler);
    polyClickHandler = null;
    polyMoveHandler = null;
    polyDoubleClickHandler = null;
    cleanupSketchLayers();
    map.doubleClickZoom.enable();
  }

  function stopLineSelect() {
    if (lineClickHandler) map.off('click', lineClickHandler);
    if (lineMoveHandler) map.off('mousemove', lineMoveHandler);
    if (lineDoubleClickHandler) map.off('dblclick', lineDoubleClickHandler);
    lineClickHandler = null;
    lineMoveHandler = null;
    lineDoubleClickHandler = null;
    cleanupSketchLayers();
    map.doubleClickZoom.enable();
  }

  function setSelectMode(mode) {
    stopEditMode();
    stopClickSelect();
    stopRectangleSelect();
    stopPolygonSelect();
    stopLineSelect();
    activeSelectMode = mode;
    document.getElementById('map').style.cursor = mode ? 'crosshair' : '';
  }

  function pointInPolygon(point, polygonLatLngs) {
    let inside = false;
    for (let i = 0, j = polygonLatLngs.length - 1; i < polygonLatLngs.length; j = i++) {
      const xi = polygonLatLngs[i].lng, yi = polygonLatLngs[i].lat;
      const xj = polygonLatLngs[j].lng, yj = polygonLatLngs[j].lat;
      const intersects = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / ((yj - yi) || 1e-12) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointToSegmentDistance(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const ab2 = abx * abx + aby * aby;
    const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const cx = a.x + t * abx;
    const cy = a.y + t * aby;
    const dx = p.x - cx;
    const dy = p.y - cy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function selectByBounds(bounds) {
    const matches = getFeatureLayers(false).filter((featureLayer) => {
      if (typeof featureLayer.getBounds === 'function') {
        const featureBounds = featureLayer.getBounds();
        return featureBounds && featureBounds.isValid && featureBounds.isValid() && bounds.intersects(featureBounds);
      }
      if (typeof featureLayer.getLatLng === 'function') return bounds.contains(featureLayer.getLatLng());
      return false;
    });
    setSelection(matches);
  }

  function selectByPolygon(polygonLatLngs) {
    const polygonBounds = L.latLngBounds(polygonLatLngs);
    const matches = getFeatureLayers(false).filter((featureLayer) => {
      const reps = getRepresentativePoints(featureLayer);
      if (reps.some((p) => pointInPolygon(p, polygonLatLngs))) return true;
      if (typeof featureLayer.getBounds === 'function') {
        const b = featureLayer.getBounds();
        if (b && b.isValid && b.isValid() && b.intersects(polygonBounds)) {
          return polygonLatLngs.some((p) => b.contains(p));
        }
      }
      return false;
    });
    setSelection(matches);
  }

  function selectByLine(lineLatLngs) {
    const linePoints = lineLatLngs.map((latlng) => map.latLngToContainerPoint(latlng));
    const tolerance = 10;
    const matches = getFeatureLayers(false).filter((featureLayer) => {
      const reps = getRepresentativePoints(featureLayer);
      return reps.some((latlng) => {
        const p = map.latLngToContainerPoint(latlng);
        for (let i = 0; i < linePoints.length - 1; i++) {
          if (pointToSegmentDistance(p, linePoints[i], linePoints[i + 1]) <= tolerance) return true;
        }
        return false;
      });
    });
    setSelection(matches);
  }

  function startSelectByClick() {
    setSelectMode('click');
    clickSelectHandler = (e) => {
      if (activeSelectMode !== 'click') return;
      toggleSelection(e.target);
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    };
    getFeatureLayers(true).forEach((featureLayer) => featureLayer.on('click', clickSelectHandler));
    console.log('Select mode: click');
  }

  function startSelectRectangle() {
    setSelectMode('rectangle');
    rectClickHandler = (e) => {
      if (!rectStart) {
        rectStart = e.latlng;
        rectSketch = L.rectangle(L.latLngBounds(rectStart, rectStart), SKETCH_STYLE).addTo(map);
        return;
      }
      const bounds = L.latLngBounds(rectStart, e.latlng);
      selectByBounds(bounds);
      rectStart = null;
      if (rectSketch && map.hasLayer(rectSketch)) map.removeLayer(rectSketch);
      rectSketch = null;
    };
    rectMoveHandler = (e) => {
      if (rectStart && rectSketch) rectSketch.setBounds(L.latLngBounds(rectStart, e.latlng));
    };
    map.on('click', rectClickHandler);
    map.on('mousemove', rectMoveHandler);
    console.log('Select mode: rectangle');
  }

  function startSelectByPolygon() {
    setSelectMode('polygon');
    map.doubleClickZoom.disable();
    polyClickHandler = (e) => {
      sketchVertices.push(e.latlng);
      if (sketchGuide && map.hasLayer(sketchGuide)) map.removeLayer(sketchGuide);
      sketchGuide = L.polyline(sketchVertices, SKETCH_STYLE).addTo(map);
    };
    polyMoveHandler = (e) => {
      if (sketchVertices.length === 0) return;
      const preview = sketchVertices.concat([e.latlng]);
      if (sketchGuide) sketchGuide.setLatLngs(preview);
    };
    polyDoubleClickHandler = (e) => {
      L.DomEvent.stop(e);
      if (sketchVertices.length < 3) return;
      selectByPolygon(sketchVertices);
      if (sketchGuide && map.hasLayer(sketchGuide)) map.removeLayer(sketchGuide);
      sketchResult = L.polygon(sketchVertices, SKETCH_STYLE).addTo(map);
      sketchVertices = [];
    };
    map.on('click', polyClickHandler);
    map.on('mousemove', polyMoveHandler);
    map.on('dblclick', polyDoubleClickHandler);
    console.log('Select mode: polygon');
  }

  function startSelectByLine() {
    setSelectMode('line');
    map.doubleClickZoom.disable();
    lineClickHandler = (e) => {
      sketchVertices.push(e.latlng);
      if (sketchGuide && map.hasLayer(sketchGuide)) map.removeLayer(sketchGuide);
      sketchGuide = L.polyline(sketchVertices, SKETCH_STYLE).addTo(map);
    };
    lineMoveHandler = (e) => {
      if (sketchVertices.length === 0 || !sketchGuide) return;
      const preview = sketchVertices.concat([e.latlng]);
      sketchGuide.setLatLngs(preview);
    };
    lineDoubleClickHandler = (e) => {
      L.DomEvent.stop(e);
      if (sketchVertices.length < 2) return;
      selectByLine(sketchVertices);
      if (sketchGuide && map.hasLayer(sketchGuide)) map.removeLayer(sketchGuide);
      sketchResult = L.polyline(sketchVertices, SKETCH_STYLE).addTo(map);
      sketchVertices = [];
    };
    map.on('click', lineClickHandler);
    map.on('mousemove', lineMoveHandler);
    map.on('dblclick', lineDoubleClickHandler);
    console.log('Select mode: line');
  }

  // Navigation tool logic
  let panModeActive = false;
  function setNavigationMode(mode) {
    setSelectMode(null);
    stopEditMode();
    if (!map) return;
    switch (mode) {
      case 'zoom-in':
        map.zoomIn();
        break;
      case 'zoom-out':
        map.zoomOut();
        break;
      case 'pan':
        panModeActive = !panModeActive;
        if (panModeActive) {
          map.dragging.enable();
        } else {
          map.dragging.disable();
        }
        break;
      case 'zoom-to-select':
        // Assume selected features are stored in window.selectedFeatures as Leaflet layers
        if (window.selectedFeatures && window.selectedFeatures.length > 0) {
          const group = L.featureGroup(window.selectedFeatures);
          map.fitBounds(group.getBounds(), { maxZoom: 16 });
        } else if (currentGeoJsonLayer) {
          const bounds = currentGeoJsonLayer.getBounds();
          if (bounds && bounds.isValid && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
            return;
          }
          alert('No selectable extent found');
        } else {
          alert('No features selected');
        }
        break;
      default:
        console.log('Navigation mode set to', mode);
    }
  }

  // Edit tool logic
  let activeEditMode = null;
  let addMapClickHandler = null;
  let addMapDoubleClickHandler = null;
  let addMapContextMenuHandler = null;
  let addSketchGuideLayer = null;
  let addSketchVertices = [];
  let addSketchLayerId = null;
  let modifyFeatureClickHandler = null;
  let modifyMapClickHandler = null;
  let deleteFeatureClickHandler = null;
  let pendingModifyFeatureLayer = null;

  function getEditableLayerEntry() {
    if (layers.length === 0) return null;
    const active = getActiveLayerEntry();
    if (active) return active;
    const visible = layers.filter((l) => l.visible);
    const fallback = (visible.length > 0 ? visible[visible.length - 1] : layers[layers.length - 1]) || null;
    if (fallback && !activeLayerId) {
      activeLayerId = fallback.id;
      refreshLayerListState();
    }
    return fallback;
  }

  function getFeatureOwnerEntry(featureLayer) {
    return layers.find((entry) => entry.layer && typeof entry.layer.hasLayer === 'function' && entry.layer.hasLayer(featureLayer)) || null;
  }

  function getFeatureIndex(entry, featureLayer) {
    if (!entry || !entry.geojson || !Array.isArray(entry.geojson.features)) return -1;
    const features = entry.geojson.features;
    const byRef = features.findIndex((f) => f === featureLayer.feature);
    if (byRef >= 0) return byRef;
    const targetGeom = JSON.stringify(featureLayer.feature?.geometry || null);
    const targetProps = JSON.stringify(featureLayer.feature?.properties || {});
    return features.findIndex((f) => JSON.stringify(f.geometry || null) === targetGeom && JSON.stringify(f.properties || {}) === targetProps);
  }

  function refreshAttributesForEntry(entry) {
    if (!entry || !entry.geojson) return;
    lastGeoJSONLoaded = entry.geojson;
    currentGeoJsonLayer = entry.layer;
    renderAttributeTable(entry.geojson);
  }

  function bindFeatureHandler(eventName, handler) {
    getFeatureLayers(true).forEach((featureLayer) => featureLayer.on(eventName, handler));
  }

  function unbindFeatureHandler(eventName, handler) {
    getFeatureLayers(true).forEach((featureLayer) => featureLayer.off(eventName, handler));
  }

  function stopEditMode() {
    if (addMapClickHandler) map.off('click', addMapClickHandler);
    if (addMapDoubleClickHandler) map.off('dblclick', addMapDoubleClickHandler);
    if (addMapContextMenuHandler) map.off('contextmenu', addMapContextMenuHandler);
    if (modifyMapClickHandler) map.off('click', modifyMapClickHandler);
    if (modifyFeatureClickHandler) unbindFeatureHandler('click', modifyFeatureClickHandler);
    if (deleteFeatureClickHandler) unbindFeatureHandler('click', deleteFeatureClickHandler);
    if (addSketchGuideLayer && map.hasLayer(addSketchGuideLayer)) map.removeLayer(addSketchGuideLayer);
    addSketchGuideLayer = null;
    addSketchVertices = [];
    addSketchLayerId = null;
    addMapClickHandler = null;
    addMapDoubleClickHandler = null;
    addMapContextMenuHandler = null;
    modifyMapClickHandler = null;
    modifyFeatureClickHandler = null;
    deleteFeatureClickHandler = null;
    pendingModifyFeatureLayer = null;
    activeEditMode = null;
    document.getElementById('map').style.cursor = '';
  }

  function getLayerGeometryType(entry) {
    if (!entry) return 'Point';
    return normalizeGeometryType(entry.geometryType || inferGeometryTypeFromGeoJSON(entry.geojson, 'Point'));
  }

  function createFeatureFromAddSketch(geomType) {
    const cleanedVertices = addSketchVertices.filter((pt, idx, arr) => {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return Math.abs(prev.lat - pt.lat) > 1e-12 || Math.abs(prev.lng - pt.lng) > 1e-12;
    });
    if (geomType === 'Point') return null;
    if (geomType === 'LineString') {
      if (cleanedVertices.length < 2) return null;
      return {
        type: 'LineString',
        coordinates: cleanedVertices.map((pt) => [pt.lng, pt.lat]),
      };
    }
    if (geomType === 'Polygon') {
      if (cleanedVertices.length < 3) return null;
      const ring = cleanedVertices.map((pt) => [pt.lng, pt.lat]);
      ring.push([cleanedVertices[0].lng, cleanedVertices[0].lat]);
      return {
        type: 'Polygon',
        coordinates: [ring],
      };
    }
    return null;
  }

  function addFeatureToEntry(entry, geometry) {
    if (!entry || !geometry) return;
    if (!entry.geojson || !Array.isArray(entry.geojson.features)) {
      entry.geojson = { type: 'FeatureCollection', features: [] };
    }
    const newFeature = {
      type: 'Feature',
      properties: {
        id: Date.now(),
        created_at: new Date().toISOString(),
      },
      geometry,
    };
    entry.geojson.features.push(newFeature);
    entry.layer.addData(newFeature);
    markLayerDirty(entry.id, true);
    refreshAttributesForEntry(entry);
  }

  function resetAddSketch() {
    addSketchVertices = [];
    addSketchLayerId = null;
    if (addSketchGuideLayer && map.hasLayer(addSketchGuideLayer)) map.removeLayer(addSketchGuideLayer);
    addSketchGuideLayer = null;
  }

  function startEditAdd() {
    setSelectMode(null);
    stopEditMode();
    const entry = getEditableLayerEntry();
    if (!entry) {
      alert('Load a layer before adding features');
      return;
    }
    const geomType = getLayerGeometryType(entry);
    activeEditMode = 'add';
    document.getElementById('map').style.cursor = 'copy';

    if (geomType !== 'Point') {
      alert(`Add mode for ${geomType}: left-click to add vertices, right-click or double-click to finish.`);
    }

    addMapClickHandler = (e) => {
      if (activeEditMode !== 'add') return;
      const activeEntry = getEditableLayerEntry();
      if (!activeEntry) return;
      const activeGeomType = getLayerGeometryType(activeEntry);

      if (activeGeomType === 'Point') {
        addFeatureToEntry(activeEntry, {
          type: 'Point',
          coordinates: [e.latlng.lng, e.latlng.lat],
        });
        console.log('Edit mode add: point feature added');
        return;
      }

      if (addSketchLayerId && addSketchLayerId !== activeEntry.id) {
        resetAddSketch();
      }

      addSketchLayerId = activeEntry.id;
      addSketchVertices.push(e.latlng);

      if (!addSketchGuideLayer) {
        addSketchGuideLayer = L.polyline(addSketchVertices, { color: '#00ffff', weight: 2, dashArray: '4,4' }).addTo(map);
      } else {
        addSketchGuideLayer.setLatLngs(addSketchVertices);
      }
    };

    const finishSketchForActiveLayer = () => {
      const activeEntry = getEditableLayerEntry();
      if (!activeEntry) return;
      const activeGeomType = getLayerGeometryType(activeEntry);
      if (activeGeomType === 'Point') return;
      if (!addSketchLayerId || addSketchLayerId !== activeEntry.id) return;
      const geometry = createFeatureFromAddSketch(activeGeomType);
      if (!geometry) {
        alert(activeGeomType === 'Polygon' ? 'Polygon needs at least 3 vertices.' : 'LineString needs at least 2 vertices.');
        return;
      }
      addFeatureToEntry(activeEntry, geometry);
      console.log(`Edit mode add: ${activeGeomType} feature added`);
      resetAddSketch();
    };

    addMapDoubleClickHandler = (e) => {
      if (activeEditMode !== 'add') return;
      L.DomEvent.stop(e);
      finishSketchForActiveLayer();
    };

    addMapContextMenuHandler = (e) => {
      if (activeEditMode !== 'add') return;
      L.DomEvent.stop(e);
      finishSketchForActiveLayer();
    };

    map.on('click', addMapClickHandler);
    map.on('dblclick', addMapDoubleClickHandler);
    map.on('contextmenu', addMapContextMenuHandler);
    console.log('Edit mode: add');
  }

  function startEditModify() {
    setSelectMode(null);
    stopEditMode();
    activeEditMode = 'modify';
    document.getElementById('map').style.cursor = 'crosshair';

    modifyFeatureClickHandler = (e) => {
      if (activeEditMode !== 'modify') return;
      const ownerEntry = getFeatureOwnerEntry(e.target);
      if (!ownerEntry || ownerEntry.id !== activeLayerId) {
        if (e.originalEvent) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
        alert('Select a feature from the active layer only.');
        return;
      }
      pendingModifyFeatureLayer = e.target;
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
      alert('Feature selected. Click a new map location to move this point.');
    };

    modifyMapClickHandler = (e) => {
      if (activeEditMode !== 'modify' || !pendingModifyFeatureLayer) return;
      const entry = getFeatureOwnerEntry(pendingModifyFeatureLayer);
      if (!entry) return;
      const idx = getFeatureIndex(entry, pendingModifyFeatureLayer);
      if (idx < 0) return;

      const feature = entry.geojson.features[idx];
      if (!feature || !feature.geometry || feature.geometry.type !== 'Point') {
        alert('Modify currently supports Point features only.');
        pendingModifyFeatureLayer = null;
        return;
      }

      feature.geometry.coordinates = [e.latlng.lng, e.latlng.lat];
      if (typeof pendingModifyFeatureLayer.setLatLng === 'function') {
        pendingModifyFeatureLayer.setLatLng(e.latlng);
      }
      markLayerDirty(entry.id, true);
      refreshAttributesForEntry(entry);
      pendingModifyFeatureLayer = null;
      console.log('Edit mode modify: feature moved');
    };

    bindFeatureHandler('click', modifyFeatureClickHandler);
    map.on('click', modifyMapClickHandler);
    console.log('Edit mode: modify');
  }

  function startEditDelete() {
    setSelectMode(null);
    stopEditMode();
    activeEditMode = 'delete';
    document.getElementById('map').style.cursor = 'not-allowed';

    deleteFeatureClickHandler = (e) => {
      if (activeEditMode !== 'delete') return;
      const featureLayer = e.target;
      const entry = getFeatureOwnerEntry(featureLayer);
      if (!entry) return;
      if (entry.id !== activeLayerId) {
        if (e.originalEvent) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
        alert('Delete is limited to the active layer. Select the layer in TOC first.');
        return;
      }
      const idx = getFeatureIndex(entry, featureLayer);
      if (idx < 0) return;

      entry.geojson.features.splice(idx, 1);
      entry.layer.removeLayer(featureLayer);
      markLayerDirty(entry.id, true);
      if (selectedFeatureSet.has(featureLayer)) {
        selectedFeatureSet.delete(featureLayer);
        updateSelectedFeaturesWindow();
      }
      refreshAttributesForEntry(entry);

      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
      console.log('Edit mode delete: feature removed');
    };

    bindFeatureHandler('click', deleteFeatureClickHandler);
    console.log('Edit mode: delete');
  }

  function openAttributeUpdater() {
    const entry = getEditableLayerEntry();
    if (!entry || !entry.geojson) {
      alert('No layer available to update attributes');
      return;
    }
    refreshAttributesForEntry(entry);
    const attrPanel = document.getElementById('attributes-panel');
    if (attrPanel) {
      attrPanel.classList.remove('collapsed');
      const toggleBtn = attrPanel.querySelector('.toggle-btn');
      if (toggleBtn) toggleBtn.textContent = '-';
    }
    console.log('Edit mode: update attributes panel opened');
  }

  // File dialog handlers
  let selectedFileContent = null; // Store file content when browsing
  
  const fileBrowseBtn = document.getElementById('dialog-file-browse');
  if (fileBrowseBtn) {
    fileBrowseBtn.addEventListener('click', async () => {
      const res = await electronAPI.openGeoJSON();
      if (res && res.path && res.content) {
        document.getElementById('dialog-file-path').value = res.path;
        selectedFileContent = res.content; // Store the content
      }
    });
  }

  const fileOkBtn = document.getElementById('dialog-file-ok');
  if (fileOkBtn) {
    fileOkBtn.addEventListener('click', async () => {
      const filePath = document.getElementById('dialog-file-path').value;
      if (!filePath || !selectedFileContent) {
        alert('Please browse and select a file first');
        return;
      }
      let selectedCRS = document.getElementById('dialog-file-crs').value || 'EPSG:3857';
      let swapCoords = document.getElementById('dialog-file-swap-coords').checked;
      
      // Handle special axis order case
      if (selectedCRS === 'EPSG:4326-latlon') {
        selectedCRS = 'EPSG:4326';
        swapCoords = true;
      }
      
      try {
        const parsed = JSON.parse(selectedFileContent);
        
        // Log original coordinates for debugging
        if (parsed.features && parsed.features.length > 0) {
          const firstFeature = parsed.features[0];
          if (firstFeature.geometry && firstFeature.geometry.coordinates) {
            console.log('Original first feature coordinates:', firstFeature.geometry.coordinates);
            console.log('Using CRS:', selectedCRS, '| Swap enabled:', swapCoords);
          }
        }
        
        hideModal('dialog-file');
        lastGeoJSONLoaded = parsed;
        lastGeoJSONSourceCRS = selectedCRS;
        const transformed = reprojectGeoJSON(parsed, selectedCRS, 'EPSG:3857', swapCoords);
        
        // Log transformed coordinates for debugging
        if (transformed.features && transformed.features.length > 0) {
          const firstFeature = transformed.features[0];
          if (firstFeature.geometry && firstFeature.geometry.coordinates) {
            console.log('Transformed first feature coordinates:', firstFeature.geometry.coordinates);
          }
        }
        
        addGeoJSONLayer(transformed, filePath.split(/[\\/]/).pop());
        
        // Log for debugging
        console.log('File loaded:', { filePath, crs: selectedCRS, swapCoords, numFeatures: parsed.features?.length || 0 });
        
        // Reset for next use
        selectedFileContent = null;
        document.getElementById('dialog-file-path').value = '';
        document.getElementById('dialog-file-swap-coords').checked = false;
      } catch (err) {
        alert('Failed to load file: ' + err.message);
        console.error('File loading error:', err);
      }
    });
  }

  const fileCancelBtn = document.getElementById('dialog-file-cancel');
  if (fileCancelBtn) {
    fileCancelBtn.addEventListener('click', () => {
      hideModal('dialog-file');
      document.getElementById('dialog-file-path').value = '';
      document.getElementById('dialog-file-crs').value = 'EPSG:4326';
    });
  }

  // DuckDB dialog handlers
  const duckdbOkBtn = document.getElementById('dialog-duckdb-ok');
  if (duckdbOkBtn) {
    duckdbOkBtn.addEventListener('click', async () => {
      const dbPath = document.getElementById('dialog-duckdb-path').value || ':memory:';
      const crs = document.getElementById('dialog-duckdb-crs').value;
      hideModal('dialog-duckdb');
      await connectToWarehouse('duckdb', dbPath, crs);
    });
  }

  const duckdbCancelBtn = document.getElementById('dialog-duckdb-cancel');
  if (duckdbCancelBtn) {
    duckdbCancelBtn.addEventListener('click', () => {
      hideModal('dialog-duckdb');
      document.getElementById('dialog-duckdb-path').value = '';
    });
  }

  // Snowflake dialog handlers
  const snowflakeOkBtn = document.getElementById('dialog-snowflake-ok');
  if (snowflakeOkBtn) {
    snowflakeOkBtn.addEventListener('click', async () => {
      const account = document.getElementById('dialog-snowflake-account').value;
      const user = document.getElementById('dialog-snowflake-user').value;
      const password = document.getElementById('dialog-snowflake-password').value;
      const crs = document.getElementById('dialog-snowflake-crs').value;
      if (!account || !user) {
        alert('Please fill in account and user');
        return;
      }
      hideModal('dialog-snowflake');
      await connectToWarehouse('snowflake', `${account}/${user}`, crs);
    });
  }

  const snowflakeCancelBtn = document.getElementById('dialog-snowflake-cancel');
  if (snowflakeCancelBtn) {
    snowflakeCancelBtn.addEventListener('click', () => {
      hideModal('dialog-snowflake');
      document.getElementById('dialog-snowflake-account').value = '';
      document.getElementById('dialog-snowflake-user').value = '';
      document.getElementById('dialog-snowflake-password').value = '';
    });
  }

  // Databricks dialog handlers
  const databricksOkBtn = document.getElementById('dialog-databricks-ok');
  if (databricksOkBtn) {
    databricksOkBtn.addEventListener('click', async () => {
      const host = document.getElementById('dialog-databricks-host').value;
      const token = document.getElementById('dialog-databricks-token').value;
      const crs = document.getElementById('dialog-databricks-crs').value;
      if (!host || !token) {
        alert('Please fill in host and token');
        return;
      }
      hideModal('dialog-databricks');
      await connectToWarehouse('databricks', `${host}`, crs);
    });
  }

  const databricksCancelBtn = document.getElementById('dialog-databricks-cancel');
  if (databricksCancelBtn) {
    databricksCancelBtn.addEventListener('click', () => {
      hideModal('dialog-databricks');
      document.getElementById('dialog-databricks-host').value = '';
      document.getElementById('dialog-databricks-token').value = '';
    });
  }

  // Iceberg dialog handlers
  const icebergOkBtn = document.getElementById('dialog-iceberg-ok');
  if (icebergOkBtn) {
    icebergOkBtn.addEventListener('click', async () => {
      const warehouse = document.getElementById('dialog-iceberg-warehouse').value;
      const catalog = document.getElementById('dialog-iceberg-catalog').value;
      const crs = document.getElementById('dialog-iceberg-crs').value;
      if (!warehouse || !catalog) {
        alert('Please fill in warehouse and catalog');
        return;
      }
      hideModal('dialog-iceberg');
      await connectToWarehouse('iceberg', `${warehouse}/${catalog}`, crs);
    });
  }

  const icebergCancelBtn = document.getElementById('dialog-iceberg-cancel');
  if (icebergCancelBtn) {
    icebergCancelBtn.addEventListener('click', () => {
      hideModal('dialog-iceberg');
      document.getElementById('dialog-iceberg-warehouse').value = '';
      document.getElementById('dialog-iceberg-catalog').value = '';
    });
  }
  // wire attribute table buttons
  document.getElementById('apply-attr-btn').addEventListener('click', () => applyAttributeEdits());
  document.getElementById('export-btn').addEventListener('click', () => exportGeoJSON());
});

async function connectToWarehouse(mode, connStr, crs = 'EPSG:4326') {
  // Stub connector: in a real app this would open a connection and run a query.
  // For now simulate by adding a small sample GeoJSON layer with name indicating the source.
  const sample = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { source: mode, conn: connStr, id: 1 }, geometry: { type: 'Point', coordinates: [0, 0] } },
      { type: 'Feature', properties: { source: mode, conn: connStr, id: 2 }, geometry: { type: 'Point', coordinates: [10, 10] } },
    ],
  };
  const transformed = reprojectGeoJSON(sample, crs, 'EPSG:3857');
  addGeoJSONLayer(transformed, `${mode} (${connStr})`);
  alert(`Connected to ${mode} (simulated) — sample layer added`);
}
