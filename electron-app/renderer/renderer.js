// Renderer: minimal map app that loads GeoJSON via preload API and displays in Leaflet
let map, baseLayer, currentGeoJsonLayer;
let lastGeoJSONLoaded = null;
let lastGeoJSONSourceCRS = null;
let layers = []; // {id, name, layer, visible, geojson, geometryType}
let layerIdSeq = 1;
let activeLayerId = null;
let currentProjectPath = null;
let projectDirty = false;
const dirtyLayerIds = new Set();

function updateProjectTitle() {
  const titleEl = document.getElementById('project-title-name');
  if (!titleEl) return;
  if (!currentProjectPath) {
    titleEl.textContent = projectDirty ? '(unsaved*)' : '(unsaved)';
    return;
  }
  titleEl.textContent = projectDirty
    ? `(${getFileBaseName(currentProjectPath)}.prj*)`
    : `(${getFileBaseName(currentProjectPath)}.prj)`;
}

function markProjectDirty(isDirty = true) {
  projectDirty = !!isDirty;
  updateProjectTitle();
}

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
  if (isDirty) markProjectDirty(true);
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

async function saveLayerToFile(layerId, options = {}) {
  const { allowPromptIfMissingSource = false } = options;
  const entry = layers.find((l) => l.id === layerId);
  if (!entry || !entry.geojson) return false;
  const content = JSON.stringify(entry.geojson, null, 2);
  if (entry.sourcePath) {
    const writeRes = await window.electronAPI.writeGeoJSON(entry.sourcePath, content);
    if (writeRes && writeRes.ok) {
      markLayerDirty(layerId, false);
      return true;
    }
  }

  if (!allowPromptIfMissingSource) {
    return false;
  }

  const defaultName = `${entry.name || 'layer'}.geojson`;
  const res = await window.electronAPI.saveGeoJSON(defaultName, content);
  if (res && !res.canceled) {
    entry.sourcePath = res.path;
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
    const saved = await saveLayerToFile(previousLayerId, { allowPromptIfMissingSource: false });
    if (!saved) {
      alert('Unable to save edits for active layer to its original file. Layer switch canceled.');
      return false;
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

function getDashArrayForLineStyle(lineStyle) {
  if (lineStyle === 'dashed') return '8,6';
  if (lineStyle === 'dotted') return '2,6';
  return null;
}

function getDefaultSymbology(geometryType = 'Point') {
  const base = {
    color: '#ff7800',
    fillColor: '#ff7800',
    radius: 6,
    weight: 2,
    fillOpacity: 0.7,
    opacity: 1,
    markerType: 'circle',
    lineStyle: 'solid'
  };
  if (geometryType === 'LineString') return Object.assign({}, base, { fillOpacity: 0, radius: 0 });
  if (geometryType === 'Polygon') return Object.assign({}, base, { fillOpacity: 0.35 });
  return base;
}

function createPointDivIcon(sym) {
  const size = Math.max(6, Number(sym.radius || 6) * 2);
  const half = Math.round(size / 2);
  const borderWidth = Math.max(1, Number(sym.weight || 1));
  const strokeColor = sym.color || '#ff7800';
  const fillColor = sym.fillColor || strokeColor;
  const opacity = Number.isFinite(Number(sym.opacity)) ? Number(sym.opacity) : 1;
  const markerType = sym.markerType || 'circle';
  let shapeStyle = `width:${size}px;height:${size}px;background:${fillColor};border:${borderWidth}px solid ${strokeColor};opacity:${opacity};`;
  if (markerType === 'square') {
    shapeStyle += 'border-radius:2px;';
  } else if (markerType === 'diamond') {
    shapeStyle += 'border-radius:1px;transform:rotate(45deg);';
  } else if (markerType === 'triangle') {
    shapeStyle = `width:0;height:0;opacity:${opacity};border-left:${half}px solid transparent;border-right:${half}px solid transparent;border-bottom:${size}px solid ${fillColor};`;
  } else {
    shapeStyle += 'border-radius:50%;';
  }
  return L.divIcon({
    className: 'point-marker-div',
    html: `<div style="${shapeStyle}"></div>`,
    iconSize: [size, size],
    iconAnchor: [half, half]
  });
}

function createLeafletLayerForGeoJSON(geojson, layerId) {
  return L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      const sym = getLayerSymDefaults(layerId) || getDefaultSymbology('Point');
      if (sym.markerType && sym.markerType !== 'circle') {
        return L.marker(latlng, { icon: createPointDivIcon(sym) });
      }
      return L.circleMarker(latlng, {
        radius: sym.radius,
        color: sym.color,
        fillColor: sym.fillColor,
        weight: sym.weight,
        fillOpacity: sym.fillOpacity,
        opacity: sym.opacity
      });
    },
    style: () => {
      const sym = getLayerSymDefaults(layerId) || getDefaultSymbology('LineString');
      return {
        color: sym.color,
        weight: sym.weight,
        fillColor: sym.fillColor,
        fillOpacity: sym.fillOpacity,
        opacity: sym.opacity,
        dashArray: getDashArrayForLineStyle(sym.lineStyle)
      };
    },
    onEachFeature: (feature, layer) => {
      const info = '<pre>' + JSON.stringify(feature.properties || {}, null, 2) + '</pre>';
      layer.bindPopup(info);
    }
  });
}

function getFileBaseName(filePath = '') {
  const name = String(filePath).split(/[\\/]/).pop() || '';
  return name.replace(/\.[^/.]+$/, '') || 'Layer';
}

function addGeoJSONLayer(geojson, name, options = {}) {
  const id = 'layer-' + layerIdSeq++;
  const geometryType = inferGeometryTypeFromGeoJSON(geojson, 'Point');
  if (!layerSym[id]) {
    entrySetSymDefaults(id, getDefaultSymbology(geometryType));
  }
  const leafletLayer = createLeafletLayerForGeoJSON(geojson, id).addTo(map);
  currentGeoJsonLayer = leafletLayer;
  layers.push({
    id,
    name: name || 'Layer ' + id,
    layer: leafletLayer,
    visible: true,
    geojson,
    geometryType,
    sourcePath: options.sourcePath || null
  });
  activeLayerId = id;

  // Fit to layer bounds if available
  try {
    const bounds = leafletLayer.getBounds();
    if (bounds.isValid && bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  } catch (e) {
    // ignore
  }

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
  const defaultSym = getLayerSymDefaults(id) || getDefaultSymbology(geometryType);
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
  
  document.getElementById('layer-list').appendChild(li);

  // populate attribute table for the last loaded geojson
  lastGeoJSONLoaded = geojson;
  renderAttributeTable(geojson);
  refreshLayerListState();
}

// Layer label context menu
function showLayerContextMenu(layerId, geojson, event) {
  openLabelSettingsDialog(layerId, geojson);
}

// Store for layer labels
const layerLabels = {};
let labelSettingsTargetLayerId = null;
const LABEL_STYLE_DEFAULTS = {
  fontSize: 12,
  color: '#111111',
  placement: 'center'
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLabelPlacementTransform(placement) {
  switch (placement) {
    case 'above':
      return 'translate(-50%, -120%)';
    case 'below':
      return 'translate(-50%, 20%)';
    case 'left':
      return 'translate(-110%, -50%)';
    case 'right':
      return 'translate(10%, -50%)';
    case 'center':
    default:
      return 'translate(-50%, -50%)';
  }
}

function getLayerLabelFields(geojson) {
  if (!geojson || !Array.isArray(geojson.features)) return [];
  const fields = new Set();
  geojson.features.forEach((feature) => {
    const props = feature && feature.properties ? feature.properties : {};
    Object.keys(props).forEach((key) => fields.add(key));
  });
  return Array.from(fields);
}

function showDialog(dialogId) {
  const overlay = document.getElementById('modal-overlay');
  const dialog = document.getElementById(dialogId);
  if (!overlay || !dialog) return;
  overlay.classList.add('visible');
  dialog.classList.add('visible');
  dialog.classList.remove('modal-hidden');
}

function hideDialog(dialogId) {
  const overlay = document.getElementById('modal-overlay');
  const dialog = document.getElementById(dialogId);
  if (!overlay || !dialog) return;
  overlay.classList.remove('visible');
  dialog.classList.remove('visible');
  dialog.classList.add('modal-hidden');
}

function openLabelSettingsDialog(layerId, geojsonOverride) {
  const layerEntry = layers.find((layerItem) => layerItem.id === layerId);
  if (!layerEntry) return;
  const geojson = geojsonOverride || layerEntry.geojson;
  const fields = getLayerLabelFields(geojson);
  if (fields.length === 0) {
    alert('No fields available for labeling in this layer.');
    return;
  }

  labelSettingsTargetLayerId = layerId;
  const fieldSelect = document.getElementById('label-field-select');
  const fontSizeInput = document.getElementById('label-font-size');
  const colorInput = document.getElementById('label-font-color');
  const placementSelect = document.getElementById('label-placement');
  if (!fieldSelect || !fontSizeInput || !colorInput || !placementSelect) return;

  const existing = layerLabels[layerId] || {};
  const existingOptions = Object.assign({}, LABEL_STYLE_DEFAULTS, existing.options || {});
  const selectedField = existing.columnName && fields.includes(existing.columnName) ? existing.columnName : fields[0];

  fieldSelect.innerHTML = '';
  fields.forEach((field) => {
    const opt = document.createElement('option');
    opt.value = field;
    opt.textContent = field;
    fieldSelect.appendChild(opt);
  });
  fieldSelect.value = selectedField;
  fontSizeInput.value = String(existingOptions.fontSize);
  colorInput.value = existingOptions.color;
  placementSelect.value = existingOptions.placement;

  showDialog('dialog-label-settings');
}

function getLabelLatLng(feature) {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;
  const coords = feature.geometry.coordinates;
  const type = feature.geometry.type;
  let first = null;

  if (type === 'Point') {
    first = coords;
  } else if (type === 'MultiPoint' || type === 'LineString') {
    first = coords[0];
  } else if (type === 'MultiLineString' || type === 'Polygon') {
    first = coords[0] && coords[0][0];
  } else if (type === 'MultiPolygon') {
    first = coords[0] && coords[0][0] && coords[0][0][0];
  }

  if (!first || typeof first[0] !== 'number' || typeof first[1] !== 'number') return null;
  return L.latLng(first[1], first[0]);
}

function clearLayerLabelMarkers(layerId) {
  map.eachLayer((layer) => {
    if (layer.layerId === layerId && layer.isLayerLabelMarker) {
      map.removeLayer(layer);
    }
  });
}

function isLayerVisible(layerId) {
  const entry = layers.find((layerEntry) => layerEntry.id === layerId);
  return !!(entry && entry.visible !== false);
}

function renderLayerLabels(layerId) {
  const labelState = layerLabels[layerId];
  clearLayerLabelMarkers(layerId);
  if (!labelState || labelState.enabled === false || !isLayerVisible(layerId)) return;

  const { columnName, geojson } = labelState;
  const styleOptions = Object.assign({}, LABEL_STYLE_DEFAULTS, labelState.options || {});
  if (!geojson || !Array.isArray(geojson.features)) return;

  geojson.features.forEach((feature) => {
    const value = feature && feature.properties ? feature.properties[columnName] : '';
    const latLng = getLabelLatLng(feature);
    if (!value || !latLng) return;

    const html = '<div style="pointer-events:none;white-space:nowrap;font-weight:700;color:' + styleOptions.color + ';font-size:' + styleOptions.fontSize + 'px;transform:' + getLabelPlacementTransform(styleOptions.placement) + ';text-shadow:0 0 2px rgba(255,255,255,0.7),0 0 3px rgba(0,0,0,0.35)">' + escapeHtml(value) + '</div>';
    const marker = L.marker(latLng, {
      icon: L.divIcon({
        className: 'label-marker',
        html,
        iconSize: null,
        iconAnchor: null
      })
    }).addTo(map);
    marker.layerId = layerId;
    marker.isLayerLabelMarker = true;
  });
}

// Display labels on map for a layer based on column
function displayLayerLabels(layerId, columnName, geojson, options = null) {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer) return;

  const existing = layerLabels[layerId] || {};
  const styleOptions = Object.assign({}, LABEL_STYLE_DEFAULTS, existing.options || {}, options || {});
  layerLabels[layerId] = { columnName, geojson, enabled: true, options: styleOptions };
  renderLayerLabels(layerId);
  markProjectDirty(true);
}

function setLayerLabelEnabled(layerId, enabled) {
  const labelState = layerLabels[layerId];
  if (!labelState) return;
  labelState.enabled = !!enabled;
  renderLayerLabels(layerId);
  markProjectDirty(true);
}

// Remove labels for a layer
function removeLayerLabels(layerId) {
  clearLayerLabelMarkers(layerId);
  delete layerLabels[layerId];
  markProjectDirty(true);
}

// Close context menu on document click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('layer-context-menu');
  if (menu && !e.target.closest('#layer-context-menu') && !e.target.closest('#layer-list')) {
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
  swatchEl.style.width = '20px';
  swatchEl.style.height = '20px';
  swatchEl.style.background = sym.fillColor || sym.color || '#888';
  if (sym.markerType === 'square') {
    swatchEl.style.borderRadius = '2px';
    swatchEl.style.transform = 'none';
  } else if (sym.markerType === 'diamond') {
    swatchEl.style.borderRadius = '1px';
    swatchEl.style.transform = 'rotate(45deg)';
  } else if (sym.markerType === 'triangle') {
    swatchEl.style.borderRadius = '0';
    swatchEl.style.transform = 'none';
    swatchEl.style.width = '0';
    swatchEl.style.height = '0';
    swatchEl.style.background = 'transparent';
    swatchEl.style.borderLeft = '10px solid transparent';
    swatchEl.style.borderRight = '10px solid transparent';
    swatchEl.style.borderBottom = `18px solid ${sym.fillColor || sym.color || '#888'}`;
    swatchEl.style.borderTop = '0';
    return;
  } else {
    swatchEl.style.borderRadius = '50%';
    swatchEl.style.transform = 'none';
  }
  swatchEl.style.border = '1px solid #ccc';
  swatchEl.style.borderLeft = '';
  swatchEl.style.borderRight = '';
  swatchEl.style.borderTop = '';
  swatchEl.style.borderBottom = '';
}

function applySymbologyToLayer(id) {
  const entry = layers.find((l) => l.id === id);
  if (!entry) return;
  const sym = layerSym[id];
  if (!sym) return;

  const geometryType = normalizeGeometryType(entry.geometryType || inferGeometryTypeFromGeoJSON(entry.geojson, 'Point'));
  if (geometryType === 'Point') {
    const isVisible = entry.visible !== false && map.hasLayer(entry.layer);
    if (entry.layer) entry.layer.remove();
    entry.layer = createLeafletLayerForGeoJSON(entry.geojson, id);
    if (isVisible) entry.layer.addTo(map);
    if (activeLayerId === id) currentGeoJsonLayer = entry.layer;
    markProjectDirty(true);
    return;
  }

  // iterate over each child layer
  entry.layer.eachLayer((ly) => {
    // path layers (LineString/Polygon) support setStyle
    if (typeof ly.setStyle === 'function') {
      ly.setStyle({
        color: sym.color,
        weight: sym.weight,
        fillColor: sym.fillColor,
        fillOpacity: sym.fillOpacity,
        opacity: sym.opacity,
        dashArray: getDashArrayForLineStyle(sym.lineStyle)
      });
    }
    // circleMarker supports setRadius via setStyle in Leaflet v1.x
    if (ly.setRadius && (!sym.markerType || sym.markerType === 'circle')) {
      try {
        ly.setStyle({
          radius: sym.radius,
          color: sym.color,
          fillColor: sym.fillColor,
          weight: sym.weight,
          fillOpacity: sym.fillOpacity,
          opacity: sym.opacity
        });
      } catch (e) {}
    } else if (typeof ly.setIcon === 'function' && typeof ly.getLatLng === 'function') {
      try { ly.setIcon(createPointDivIcon(sym)); } catch (e) {}
    }
  });
  markProjectDirty(true);
}

function showSymEditor(id, liElement) {
  // remove existing editor if present
  const existing = document.getElementById('sym-editor-' + id);
  if (existing) { existing.remove(); return; }
  const entry = layers.find((l) => l.id === id);
  const geometryType = normalizeGeometryType(entry ? entry.geometryType : 'Point');
  const sym = layerSym[id] || getDefaultSymbology(geometryType);
  const editor = document.createElement('div');
  editor.id = 'sym-editor-' + id;
  editor.className = 'sym-editor';
  let controls = '';
  if (geometryType === 'Point') {
    controls = `
      <label>Marker: <select id="sym-marker-${id}">
        <option value="circle">Circle</option>
        <option value="square">Square</option>
        <option value="diamond">Diamond</option>
        <option value="triangle">Triangle</option>
      </select></label>
      <label>Size: <input type="number" id="sym-radius-${id}" value="${sym.radius}" min="2" /></label>
      <label>Outline Color: <input type="color" id="sym-color-${id}" value="${sym.color}" /></label>
      <label>Fill Color: <input type="color" id="sym-fill-${id}" value="${sym.fillColor || sym.color}" /></label>
      <label>Outline Width: <input type="number" id="sym-weight-${id}" value="${sym.weight}" min="0" step="1"/></label>
      <label>Opacity: <input type="range" id="sym-opacity-${id}" value="${sym.opacity}" min="0" max="1" step="0.05"/></label>
      <label>Fill opacity: <input type="range" id="sym-fillop-${id}" value="${sym.fillOpacity}" min="0" max="1" step="0.05"/></label>
    `;
  } else if (geometryType === 'LineString') {
    controls = `
      <label>Line Color: <input type="color" id="sym-color-${id}" value="${sym.color}" /></label>
      <label>Line Width: <input type="number" id="sym-weight-${id}" value="${sym.weight}" min="1" step="1"/></label>
      <label>Line Style: <select id="sym-linestyle-${id}">
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
      </select></label>
      <label>Line opacity: <input type="range" id="sym-opacity-${id}" value="${sym.opacity}" min="0" max="1" step="0.05"/></label>
    `;
  } else {
    controls = `
      <label>Outline Color: <input type="color" id="sym-color-${id}" value="${sym.color}" /></label>
      <label>Outline Width: <input type="number" id="sym-weight-${id}" value="${sym.weight}" min="1" step="1"/></label>
      <label>Outline Style: <select id="sym-linestyle-${id}">
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
      </select></label>
      <label>Outline opacity: <input type="range" id="sym-opacity-${id}" value="${sym.opacity}" min="0" max="1" step="0.05"/></label>
      <label>Fill Color: <input type="color" id="sym-fill-${id}" value="${sym.fillColor || sym.color}" /></label>
      <label>Fill opacity: <input type="range" id="sym-fillop-${id}" value="${sym.fillOpacity}" min="0" max="1" step="0.05"/></label>
    `;
  }
  editor.innerHTML = `${controls}<div style="display:flex;gap:8px;margin-top:8px"><button id="sym-apply-${id}">Apply</button><button id="sym-close-${id}">Close</button></div>`;
  liElement.appendChild(editor);
  const markerSelect = document.getElementById(`sym-marker-${id}`);
  if (markerSelect) markerSelect.value = sym.markerType || 'circle';
  const lineStyleSelect = document.getElementById(`sym-linestyle-${id}`);
  if (lineStyleSelect) lineStyleSelect.value = sym.lineStyle || 'solid';

  document.getElementById(`sym-apply-${id}`).addEventListener('click', () => {
    const newSym = Object.assign({}, sym);
    const colorInput = document.getElementById(`sym-color-${id}`);
    const fillInput = document.getElementById(`sym-fill-${id}`);
    const radiusInput = document.getElementById(`sym-radius-${id}`);
    const weightInput = document.getElementById(`sym-weight-${id}`);
    const fillOpacityInput = document.getElementById(`sym-fillop-${id}`);
    const opacityInput = document.getElementById(`sym-opacity-${id}`);
    const lineStyleInput = document.getElementById(`sym-linestyle-${id}`);
    if (colorInput) newSym.color = colorInput.value;
    if (fillInput) newSym.fillColor = fillInput.value;
    if (radiusInput) newSym.radius = Number(radiusInput.value);
    if (weightInput) newSym.weight = Number(weightInput.value);
    if (fillOpacityInput) newSym.fillOpacity = Number(fillOpacityInput.value);
    if (opacityInput) newSym.opacity = Number(opacityInput.value);
    if (lineStyleInput) newSym.lineStyle = lineStyleInput.value;
    if (markerSelect) newSym.markerType = markerSelect.value;
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
    renderLayerLabels(id);
  } else {
    map.removeLayer(entry.layer);
    entry.visible = false;
    clearLayerLabelMarkers(id);
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
    const labelSettingsDialog = document.getElementById('dialog-label-settings');
    if (labelSettingsDialog) {
      document.getElementById('label-settings-ok').onclick = function() {
        const targetLayerId = labelSettingsTargetLayerId;
        const layerEntry = layers.find((l) => l.id === targetLayerId);
        if (!targetLayerId || !layerEntry) {
          hideModal('dialog-label-settings');
          return;
        }
        const fieldSelect = document.getElementById('label-field-select');
        const fontSizeInput = document.getElementById('label-font-size');
        const colorInput = document.getElementById('label-font-color');
        const placementSelect = document.getElementById('label-placement');
        const fontSize = Number(fontSizeInput.value);
        displayLayerLabels(
          targetLayerId,
          fieldSelect.value,
          layerEntry.geojson,
          {
            fontSize: Number.isFinite(fontSize) ? Math.min(48, Math.max(8, fontSize)) : LABEL_STYLE_DEFAULTS.fontSize,
            color: colorInput.value || LABEL_STYLE_DEFAULTS.color,
            placement: placementSelect.value || LABEL_STYLE_DEFAULTS.placement
          }
        );
        hideModal('dialog-label-settings');
      };
      document.getElementById('label-settings-cancel').onclick = function() {
        hideModal('dialog-label-settings');
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
          <button id="toc-label-field">Set Label Field</button>
          <button id="toc-toggle-labels"></button>
          <button id="toc-clear-labels">Clear Labels</button>
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
      const layerEntry = layers.find((l) => l.id === layerId);
      const labelState = layerLabels[layerId] || null;
      const setFieldBtn = document.getElementById('toc-label-field');
      const toggleLabelsBtn = document.getElementById('toc-toggle-labels');
      const clearLabelsBtn = document.getElementById('toc-clear-labels');

      setFieldBtn.onclick = function() {
        menu.style.display = 'none';
        openLabelSettingsDialog(layerId, layerEntry && layerEntry.geojson ? layerEntry.geojson : null);
      };

      if (labelState) {
        const labelsEnabled = labelState.enabled !== false;
        toggleLabelsBtn.textContent = labelsEnabled ? 'Labels OFF' : 'Labels ON';
        toggleLabelsBtn.disabled = false;
        toggleLabelsBtn.onclick = function() {
          setLayerLabelEnabled(layerId, !labelsEnabled);
          menu.style.display = 'none';
        };
        clearLabelsBtn.disabled = false;
      } else {
        toggleLabelsBtn.textContent = 'Labels OFF';
        toggleLabelsBtn.disabled = true;
        clearLabelsBtn.disabled = true;
      }

      clearLabelsBtn.onclick = function() {
        removeLayerLabels(layerId);
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
      markProjectDirty(true);
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

    function clearProjectWorkspace() {
      stopEditMode();
      clearSelection();
      Object.keys(layerLabels).forEach((layerId) => removeLayerLabels(layerId));
      layers.forEach((layerEntry) => {
        if (layerEntry && layerEntry.layer) layerEntry.layer.remove();
      });
      layers = [];
      activeLayerId = null;
      lastGeoJSONLoaded = null;
      currentGeoJsonLayer = null;
      Object.keys(layerSym).forEach((key) => delete layerSym[key]);
      dirtyLayerIds.clear();
      layerIdSeq = 1;
      projectDirty = false;
      renderLayerList();
      const attributeTable = document.getElementById('attribute-table');
      if (attributeTable) attributeTable.style.display = 'none';
      updateProjectTitle();
    }

    function buildProjectState() {
      const center = map ? map.getCenter() : null;
      const mapState = center ? { center: [center.lat, center.lng], zoom: map.getZoom() } : null;
      return {
        type: 'NexaMapProject',
        version: 1,
        savedAt: new Date().toISOString(),
        map: mapState,
        activeLayerId,
        layerIdSeq,
        dirtyLayerIds: Array.from(dirtyLayerIds),
        layers: layers.map((layerEntry) => ({
          id: layerEntry.id,
          name: layerEntry.name,
          visible: layerEntry.visible !== false,
          geometryType: layerEntry.geometryType,
          sourcePath: layerEntry.sourcePath || null,
          geojson: layerEntry.geojson,
          symbology: layerSym[layerEntry.id] || getDefaultSymbology(layerEntry.geometryType || 'Point'),
          labels: layerLabels[layerEntry.id]
            ? {
                columnName: layerLabels[layerEntry.id].columnName,
                enabled: layerLabels[layerEntry.id].enabled !== false,
                options: Object.assign({}, LABEL_STYLE_DEFAULTS, layerLabels[layerEntry.id].options || {}),
              }
            : null,
        })),
      };
    }

    function loadProjectState(projectData, sourcePath) {
      if (!projectData || !Array.isArray(projectData.layers)) {
        alert('Invalid project file.');
        return false;
      }
      clearProjectWorkspace();

      projectData.layers.forEach((layerDef) => {
        const geojson = layerDef.geojson || { type: 'FeatureCollection', features: [] };
        const created = createEmptyLayer(
          layerDef.name || 'Layer',
          layerDef.geometryType || inferGeometryTypeFromGeoJSON(geojson, 'Point'),
          geojson,
          {
            layerId: layerDef.id,
            visible: layerDef.visible !== false,
            activate: false,
            skipRender: true,
            symbology: layerDef.symbology || null,
            sourcePath: layerDef.sourcePath || null
          }
        );
        if (!created) return;
        if (layerDef.labels && layerDef.labels.columnName) {
          layerLabels[created.id] = {
            columnName: layerDef.labels.columnName,
            geojson: created.geojson,
            enabled: layerDef.labels.enabled !== false,
            options: Object.assign({}, LABEL_STYLE_DEFAULTS, layerDef.labels.options || {}),
          };
        }
      });

      if (projectData.layerIdSeq && Number.isFinite(Number(projectData.layerIdSeq))) {
        layerIdSeq = Math.max(layerIdSeq, Number(projectData.layerIdSeq));
      }

      const projectDirtyIds = new Set(Array.isArray(projectData.dirtyLayerIds) ? projectData.dirtyLayerIds : []);
      dirtyLayerIds.clear();
      layers.forEach((layerEntry) => {
        if (projectDirtyIds.has(layerEntry.id)) dirtyLayerIds.add(layerEntry.id);
      });

      if (projectData.activeLayerId && layers.some((layerEntry) => layerEntry.id === projectData.activeLayerId)) {
        activeLayerId = projectData.activeLayerId;
      } else {
        activeLayerId = layers.length > 0 ? layers[layers.length - 1].id : null;
      }

      renderLayerList();
      layers.forEach((layerEntry) => renderLayerLabels(layerEntry.id));

      if (projectData.map && Array.isArray(projectData.map.center) && projectData.map.center.length === 2) {
        const lat = Number(projectData.map.center[0]);
        const lng = Number(projectData.map.center[1]);
        const zoom = Number(projectData.map.zoom);
        if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(zoom)) {
          map.setView([lat, lng], zoom);
        }
      }

      const activeEntry = getActiveLayerEntry();
      if (activeEntry) refreshAttributesForEntry(activeEntry);
      currentProjectPath = sourcePath || null;
      projectDirty = false;
      updateProjectTitle();
      return true;
    }

    function loadProjectFromContent(content, sourcePath) {
      try {
        const projectData = JSON.parse(content);
        const ok = loadProjectState(projectData, sourcePath);
        if (!ok) return false;
        return true;
      } catch (err) {
        alert('Failed to load project: ' + err.message);
        return false;
      }
    }

    async function openProjectFromDialog() {
      const proceed = await confirmSaveBeforeProjectClose();
      if (!proceed) return;
      const res = await window.electronAPI.openProject();
      if (!res || res.canceled) return;
      if (res.error) {
        alert('Open project failed: ' + res.error);
        return;
      }
      loadProjectFromContent(res.content, res.path);
    }

    async function saveProjectToFile() {
      const projectData = buildProjectState();
      const projectName = getFileBaseName(currentProjectPath || 'project');
      const defaultName = `${projectName}.prj`;
      const content = JSON.stringify(projectData, null, 2);
      if (currentProjectPath) {
        const writeRes = await window.electronAPI.writeProject(currentProjectPath, content);
        if (!writeRes || !writeRes.ok) {
          alert('Save project failed: ' + (writeRes && writeRes.error ? writeRes.error : 'Unknown error'));
          return;
        }
        projectDirty = false;
        updateProjectTitle();
        return;
      }

      const res = await window.electronAPI.saveProject(defaultName, content, currentProjectPath || undefined);
      if (!res || res.canceled) return;
      if (res.error) {
        alert('Save project failed: ' + res.error);
        return;
      }
      currentProjectPath = res.path;
      projectDirty = false;
      updateProjectTitle();
    }

    async function saveProjectAsToFile() {
      const projectData = buildProjectState();
      const projectName = getFileBaseName(currentProjectPath || 'project');
      const defaultName = `${projectName}.prj`;
      const content = JSON.stringify(projectData, null, 2);
      const res = await window.electronAPI.saveProject(defaultName, content, currentProjectPath || undefined);
      if (!res || res.canceled) return;
      if (res.error) {
        alert('Save project failed: ' + res.error);
        return;
      }
      currentProjectPath = res.path;
      projectDirty = false;
      updateProjectTitle();
    }

    async function saveAllLayerEdits() {
      const dirtyIds = Array.from(dirtyLayerIds);
      if (dirtyIds.length === 0) {
        alert('No unsaved layer edits.');
        return;
      }
      const failedLayers = [];
      for (const layerId of dirtyIds) {
        const ok = await saveLayerToFile(layerId, { allowPromptIfMissingSource: false });
        if (!ok) {
          const entry = layers.find((l) => l.id === layerId);
          failedLayers.push(entry ? entry.name : layerId);
        }
      }
      if (failedLayers.length > 0) {
        alert('Could not save these layers because no source file is linked:\n' + failedLayers.join('\n'));
        return;
      }
      alert('Layer edits saved.');
    }

    async function confirmSaveBeforeProjectClose() {
      if (!projectDirty) return true;
      const saveNow = confirm('Project has unsaved edits. Click OK to save before closing it.');
      if (saveNow) {
        await saveProjectToFile();
        return !projectDirty;
      }
      const discard = confirm('Close project without saving changes?');
      return !!discard;
    }

    async function closeCurrentProject() {
      const proceed = await confirmSaveBeforeProjectClose();
      if (!proceed) return;
      clearProjectWorkspace();
      currentProjectPath = null;
      projectDirty = false;
      map.setView([0, 0], 2);
      updateProjectTitle();
    }

    async function createNewProject() {
      const proceed = await confirmSaveBeforeProjectClose();
      if (!proceed) return;
      clearProjectWorkspace();
      currentProjectPath = null;
      projectDirty = false;
      map.setView([0, 0], 2);
      updateProjectTitle();
    }

    // Create empty layer
    function createEmptyLayer(name, geomType, geojson, options = {}) {
      const id = options.layerId || ('layer-' + layerIdSeq++);
      const newGeojson = geojson || { type: 'FeatureCollection', features: [] };
      const geometryType = normalizeGeometryType(geomType || inferGeometryTypeFromGeoJSON(newGeojson, 'Point'));
      if (options.layerId) {
        const seqMatch = /^layer-(\d+)$/.exec(options.layerId);
        if (seqMatch) {
          const parsedSeq = Number(seqMatch[1]);
          if (Number.isFinite(parsedSeq)) layerIdSeq = Math.max(layerIdSeq, parsedSeq + 1);
        }
      }
      if (!layerSym[id]) {
        entrySetSymDefaults(id, options.symbology || getDefaultSymbology(geometryType));
      }
      const leafletLayer = createLeafletLayerForGeoJSON(newGeojson, id).addTo(map);
      const visible = options.visible !== false;
      if (!visible) leafletLayer.remove();
      layers.push({
        id,
        name,
        layer: leafletLayer,
        visible,
        geojson: newGeojson,
        geometryType,
        sourcePath: options.sourcePath || null
      });
      if (options.activate !== false) activeLayerId = id;
      if (!options.skipRender) renderLayerList();
      if (!options.skipRender) markProjectDirty(true);
      return layers[layers.length - 1];
    }

    // Rename layer
    function renameLayer(layerId, newName) {
      const l = layers.find(l => l.id === layerId);
      if (l) { l.name = newName; renderLayerList(); markProjectDirty(true); }
    }

    // Remove layer
    function removeLayer(layerId) {
      const idx = layers.findIndex(l => l.id === layerId);
      if (idx !== -1) {
        if (activeLayerId === layerId) activeLayerId = null;
        dirtyLayerIds.delete(layerId);
        removeLayerLabels(layerId);
        if (layers[idx].layer) layers[idx].layer.remove();
        layers.splice(idx, 1);
        if (!activeLayerId && layers.length > 0) activeLayerId = layers[layers.length - 1].id;
        renderLayerList();
        markProjectDirty(true);
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
        const sym = getLayerSymDefaults(l.id) || getDefaultSymbology(l.geometryType || 'Point');
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
          if (visible) {
            l.layer.addTo(map);
            renderLayerLabels(layerId);
          } else {
            l.layer.remove();
            clearLayerLabelMarkers(layerId);
          }
        }
        markProjectDirty(true);
      }
    }
  console.log('=== DOM LOADED ===');
  console.log('All buttons:', {
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
  updateProjectTitle();

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
          addGeoJSONLayer(transformed, getFileBaseName(res.path), { sourcePath: res.path });
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
  const dialogPrintSettings = document.getElementById('dialog-print-settings');
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
            case 'select-clear': return clearSelection();
            case 'nav-zoomin': return setNavigationMode('zoom-in');
            case 'nav-zoomout': return setNavigationMode('zoom-out');
            case 'nav-pan': return setNavigationMode('pan');
            case 'nav-zoomselect': return setNavigationMode('zoom-to-select');
            case 'edit-add': return startEditAdd();
            case 'edit-modify': return startEditModify();
            case 'edit-delete': return startEditDelete();
            case 'edit-save': return saveAllLayerEdits();
            case 'edit-undo': return undoEditAction();
            case 'edit-redo': return redoEditAction();
            case 'update-attributes': return openAttributeUpdater();
          }
        });
      });
    }
  });

  if (window.electronAPI.onOpenProjectFromShell) {
    window.electronAPI.onOpenProjectFromShell(async (payload) => {
      if (!payload || !payload.path) return;
      const res = await window.electronAPI.readProject(payload.path);
      if (!res || res.canceled) {
        if (res && res.error) alert('Open project failed: ' + res.error);
        return;
      }
      loadProjectFromContent(res.content, res.path);
    });
  }

  if (window.electronAPI.onMenuAction) {
    window.electronAPI.onMenuAction(async (payload) => {
      if (!payload || !payload.action) return;
      const action = payload.action;
      if (action === 'open-project') await openProjectFromDialog();
      else if (action === 'save-project') await saveProjectToFile();
      else if (action === 'save-project-as') await saveProjectAsToFile();
      else if (action === 'close-project') await closeCurrentProject();
      else if (action === 'create-project') await createNewProject();
    });
  }

  // Print button
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      if (!dialogPrintSettings) return;
      showModal('dialog-print-settings');
    });
  }

  const printOkBtn = document.getElementById('print-settings-ok');
  if (printOkBtn) {
    printOkBtn.addEventListener('click', async () => {
      const settings = {
        title: (document.getElementById('print-title').value || 'Map Export').trim(),
        pageSize: document.getElementById('print-page-size').value || 'A4',
        orientation: document.getElementById('print-orientation').value || 'landscape',
        includeLegend: !!document.getElementById('print-include-legend').checked,
        includeNorthArrow: !!document.getElementById('print-include-north-arrow').checked,
        includeScaleBar: !!document.getElementById('print-include-scale-bar').checked,
        includeAttrTable: !!document.getElementById('print-include-attr-table').checked
      };
      hideModal('dialog-print-settings');
      await renderAndSavePdf(settings);
    });
  }

  const printCancelBtn = document.getElementById('print-settings-cancel');
  if (printCancelBtn) {
    printCancelBtn.addEventListener('click', () => hideModal('dialog-print-settings'));
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
  let rectSelecting = false;
  let rectSketch = null;
  let rectDownHandler = null;
  let rectMoveHandler = null;
  let rectUpHandler = null;
  let rectDragRestoreEnabled = true;
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
    if (rectDownHandler) map.off('mousedown', rectDownHandler);
    if (rectMoveHandler) map.off('mousemove', rectMoveHandler);
    if (rectUpHandler) map.off('mouseup', rectUpHandler);
    rectDownHandler = null;
    rectMoveHandler = null;
    rectUpHandler = null;
    rectSelecting = false;
    cleanupSketchLayers();
    if (map && map.dragging) {
      if (rectDragRestoreEnabled) map.dragging.enable();
      else map.dragging.disable();
    }
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

  function featureIntersectsBounds(featureLayer, bounds) {
    if (!featureLayer || !bounds) return false;
    if (typeof featureLayer.getBounds === 'function') {
      const b = featureLayer.getBounds();
      return !!(b && b.isValid && b.isValid() && bounds.intersects(b));
    }
    if (typeof featureLayer.getLatLng === 'function') return bounds.contains(featureLayer.getLatLng());
    return false;
  }

  function createPrintableLayer(geojson, sym, mapInstance) {
    return L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        if (sym.markerType && sym.markerType !== 'circle') {
          return L.marker(latlng, { icon: createPointDivIcon(sym) });
        }
        return L.circleMarker(latlng, {
          radius: sym.radius,
          color: sym.color,
          fillColor: sym.fillColor,
          weight: sym.weight,
          fillOpacity: sym.fillOpacity,
          opacity: sym.opacity
        });
      },
      style: () => ({
        color: sym.color,
        weight: sym.weight,
        fillColor: sym.fillColor,
        fillOpacity: sym.fillOpacity,
        opacity: sym.opacity,
        dashArray: getDashArrayForLineStyle(sym.lineStyle)
      }),
    }).addTo(mapInstance);
  }

  function collectPrintAttributeRows(bounds) {
    const rows = [];
    getFeatureLayers(false).forEach((featureLayer) => {
      if (!featureIntersectsBounds(featureLayer, bounds)) return;
      const owner = getFeatureOwnerEntry(featureLayer);
      const props = featureLayer.feature && featureLayer.feature.properties ? featureLayer.feature.properties : {};
      rows.push({
        layer: owner ? owner.name : 'Layer',
        geometry: featureLayer.feature && featureLayer.feature.geometry ? featureLayer.feature.geometry.type : '',
        properties: props
      });
    });
    return rows;
  }

  async function renderAndSavePdf(settings) {
    const layout = document.createElement('div');
    layout.id = 'pdf-print-layout';
    layout.innerHTML = `
      <div class="print-sheet">
        <div class="print-header">${escapeHtml(settings.title || 'Map Export')}</div>
        <div class="print-body">
          <div class="print-map-wrap">
            <div id="pdf-print-map"></div>
          </div>
          <aside class="print-side" id="pdf-print-side"></aside>
        </div>
      </div>
      <div class="print-attrs-pages" id="pdf-print-attrs-pages"></div>
    `;
    document.body.appendChild(layout);

    const printMapEl = document.getElementById('pdf-print-map');
    const sideEl = document.getElementById('pdf-print-side');
    const attrsPagesEl = document.getElementById('pdf-print-attrs-pages');
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const printMap = L.map(printMapEl, { zoomControl: false, attributionControl: false });
    printMap.setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(printMap);

    layers
      .filter((layerEntry) => layerEntry.visible !== false)
      .forEach((layerEntry) => {
        const sym = getLayerSymDefaults(layerEntry.id) || getDefaultSymbology(layerEntry.geometryType || 'Point');
        createPrintableLayer(layerEntry.geojson, sym, printMap);
      });

    if (settings.includeScaleBar) {
      L.control.scale({ imperial: true, metric: true }).addTo(printMap);
    }

    if (settings.includeNorthArrow) {
      const north = document.createElement('div');
      north.className = 'print-north';
      north.textContent = 'N ↑';
      printMapEl.parentElement.appendChild(north);
    }

    if (settings.includeLegend) {
      const legendTitle = document.createElement('h4');
      legendTitle.textContent = 'Legend';
      legendTitle.style.margin = '0 0 8px';
      sideEl.appendChild(legendTitle);
      layers.filter((layerEntry) => layerEntry.visible !== false).forEach((layerEntry) => {
        const sym = getLayerSymDefaults(layerEntry.id) || getDefaultSymbology(layerEntry.geometryType || 'Point');
        const row = document.createElement('div');
        row.className = 'print-legend-item';
        const sw = document.createElement('span');
        sw.className = 'print-legend-swatch';
        sw.style.background = sym.fillColor || sym.color || '#888';
        sw.style.borderColor = sym.color || '#666';
        row.appendChild(sw);
        const txt = document.createElement('span');
        txt.textContent = layerEntry.name;
        row.appendChild(txt);
        sideEl.appendChild(row);
      });
    }

    if (settings.includeAttrTable) {
      const rows = collectPrintAttributeRows(bounds);
      const columns = new Set(['Layer', 'Geometry']);
      rows.forEach((row) => {
        Object.keys(row.properties || {}).forEach((k) => columns.add(k));
      });
      const colList = Array.from(columns);

      attrsPagesEl.innerHTML = '';
      const pageTitle = document.createElement('h3');
      pageTitle.className = 'print-page-break';
      pageTitle.textContent = 'Attributes (Current Extent)';
      pageTitle.style.margin = '0 0 8px';
      attrsPagesEl.appendChild(pageTitle);

      const countInfo = document.createElement('div');
      countInfo.style.fontSize = '12px';
      countInfo.style.color = '#334e68';
      countInfo.textContent = `Total features in extent: ${rows.length}`;
      attrsPagesEl.appendChild(countInfo);

      const table = document.createElement('table');
      table.className = 'print-attr-table';
      const thead = document.createElement('thead');
      const trh = document.createElement('tr');
      colList.forEach((c) => {
        const th = document.createElement('th');
        th.textContent = c;
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      rows.forEach((row) => {
        const tr = document.createElement('tr');
        colList.forEach((c) => {
          const td = document.createElement('td');
          if (c === 'Layer') td.textContent = row.layer;
          else if (c === 'Geometry') td.textContent = row.geometry;
          else {
            const v = row.properties ? row.properties[c] : '';
            td.textContent = typeof v === 'undefined' || v === null ? '' : String(v);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      attrsPagesEl.appendChild(table);
    } else {
      attrsPagesEl.remove();
    }

    await new Promise((resolve) => setTimeout(resolve, 1300));
    const pdfRes = await window.electronAPI.saveCurrentWindowPdf({
      defaultName: `${(settings.title || 'map-export').replace(/[\\/:*?"<>|]+/g, '_')}.pdf`,
      orientation: settings.orientation,
      pageSize: settings.pageSize
    });

    printMap.remove();
    layout.remove();

    if (pdfRes && pdfRes.error) {
      alert('PDF export failed: ' + pdfRes.error);
      return;
    }
    if (pdfRes && !pdfRes.canceled) {
      alert('PDF saved: ' + pdfRes.path);
    }
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
    rectDragRestoreEnabled = !!(map && map.dragging && map.dragging.enabled && map.dragging.enabled());
    if (map && map.dragging) map.dragging.disable();

    rectDownHandler = (e) => {
      if (activeSelectMode !== 'rectangle') return;
      if (e.originalEvent && e.originalEvent.button !== 0) return;
      rectStart = e.latlng;
      rectSelecting = true;
      if (rectSketch && map.hasLayer(rectSketch)) map.removeLayer(rectSketch);
      rectSketch = L.rectangle(L.latLngBounds(rectStart, rectStart), SKETCH_STYLE).addTo(map);
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    };

    rectMoveHandler = (e) => {
      if (!rectSelecting || !rectStart || !rectSketch) return;
      rectSketch.setBounds(L.latLngBounds(rectStart, e.latlng));
    };

    rectUpHandler = (e) => {
      if (!rectSelecting || !rectStart) return;
      const bounds = L.latLngBounds(rectStart, e.latlng);
      selectByBounds(bounds);
      rectSelecting = false;
      rectStart = null;
      if (rectSketch && map.hasLayer(rectSketch)) map.removeLayer(rectSketch);
      rectSketch = null;
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    };

    map.on('mousedown', rectDownHandler);
    map.on('mousemove', rectMoveHandler);
    map.on('mouseup', rectUpHandler);
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
  const editUndoStack = [];
  const editRedoStack = [];
  const MAX_EDIT_HISTORY = 100;

  function cloneGeoJSON(obj) {
    return JSON.parse(JSON.stringify(obj || { type: 'FeatureCollection', features: [] }));
  }

  function rebuildLayerFromGeoJSON(layerId) {
    const entry = layers.find((l) => l.id === layerId);
    if (!entry) return false;
    const isVisible = entry.visible !== false && map.hasLayer(entry.layer);
    if (entry.layer) entry.layer.remove();
    entry.layer = createLeafletLayerForGeoJSON(entry.geojson, entry.id);
    if (isVisible) entry.layer.addTo(map);
    if (activeLayerId === entry.id) currentGeoJsonLayer = entry.layer;
    refreshAttributesForEntry(entry);
    renderLayerLabels(entry.id);
    return true;
  }

  function pushUndoSnapshot(layerId, geojsonSnapshot) {
    if (!layerId || !geojsonSnapshot) return;
    editUndoStack.push({ layerId, geojson: cloneGeoJSON(geojsonSnapshot) });
    if (editUndoStack.length > MAX_EDIT_HISTORY) editUndoStack.shift();
    editRedoStack.length = 0;
  }

  function undoEditAction() {
    if (editUndoStack.length === 0) {
      alert('Nothing to undo.');
      return;
    }
    stopEditMode();
    clearSelection();
    const item = editUndoStack.pop();
    const entry = layers.find((l) => l.id === item.layerId);
    if (!entry) return;
    editRedoStack.push({ layerId: item.layerId, geojson: cloneGeoJSON(entry.geojson) });
    entry.geojson = cloneGeoJSON(item.geojson);
    rebuildLayerFromGeoJSON(item.layerId);
    markLayerDirty(item.layerId, true);
    markProjectDirty(true);
  }

  function redoEditAction() {
    if (editRedoStack.length === 0) {
      alert('Nothing to redo.');
      return;
    }
    stopEditMode();
    clearSelection();
    const item = editRedoStack.pop();
    const entry = layers.find((l) => l.id === item.layerId);
    if (!entry) return;
    editUndoStack.push({ layerId: item.layerId, geojson: cloneGeoJSON(entry.geojson) });
    entry.geojson = cloneGeoJSON(item.geojson);
    rebuildLayerFromGeoJSON(item.layerId);
    markLayerDirty(item.layerId, true);
    markProjectDirty(true);
  }

  function getEntryAttributeKeys(entry) {
    if (!entry || !entry.geojson || !Array.isArray(entry.geojson.features)) return [];
    const keys = new Set();
    entry.geojson.features.forEach((feature) => {
      const props = feature && feature.properties ? feature.properties : {};
      Object.keys(props).forEach((key) => {
        if (key !== 'id' && key !== 'created_at') keys.add(key);
      });
    });
    return Array.from(keys);
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

  function promptFeatureAttributes(entry) {
    return new Promise((resolve) => {
      const container = document.getElementById('add-feature-attrs-container');
      const extraJson = document.getElementById('add-feature-attrs-json');
      const okBtn = document.getElementById('add-feature-attrs-ok');
      const cancelBtn = document.getElementById('add-feature-attrs-cancel');
      if (!container || !extraJson || !okBtn || !cancelBtn) {
        resolve({});
        return;
      }

      const keys = getEntryAttributeKeys(entry);
      container.innerHTML = '';
      const effectiveKeys = keys.length > 0 ? keys : ['name'];
      effectiveKeys.forEach((key) => {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';
        row.innerHTML = `<label>${key}:</label><input data-attr-key="${key}" placeholder="${key}" />`;
        container.appendChild(row);
      });
      extraJson.value = '';

      const cleanup = () => {
        okBtn.onclick = null;
        cancelBtn.onclick = null;
      };

      okBtn.onclick = () => {
        const attrs = {};
        container.querySelectorAll('input[data-attr-key]').forEach((input) => {
          const key = input.dataset.attrKey;
          const parsed = parseAttributeValue(input.value);
          if (typeof parsed !== 'undefined') attrs[key] = parsed;
        });

        const extraRaw = String(extraJson.value || '').trim();
        if (extraRaw) {
          try {
            const parsedExtra = JSON.parse(extraRaw);
            if (parsedExtra && typeof parsedExtra === 'object' && !Array.isArray(parsedExtra)) {
              Object.assign(attrs, parsedExtra);
            } else {
              alert('Extra attributes must be a JSON object.');
              return;
            }
          } catch (err) {
            alert('Invalid JSON in extra attributes: ' + err.message);
            return;
          }
        }
        cleanup();
        hideModal('dialog-add-feature-attrs');
        resolve(attrs);
      };

      cancelBtn.onclick = () => {
        cleanup();
        hideModal('dialog-add-feature-attrs');
        resolve(null);
      };

      showModal('dialog-add-feature-attrs');
    });
  }

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

  async function addFeatureToEntry(entry, geometry) {
    if (!entry || !geometry) return false;
    if (!entry.geojson || !Array.isArray(entry.geojson.features)) {
      entry.geojson = { type: 'FeatureCollection', features: [] };
    }
    const beforeSnapshot = cloneGeoJSON(entry.geojson);
    const attrs = await promptFeatureAttributes(entry);
    if (attrs === null) return false;
    const newFeature = {
      type: 'Feature',
      properties: {
        ...(attrs || {}),
        id: Date.now(),
        created_at: new Date().toISOString(),
      },
      geometry,
    };
    pushUndoSnapshot(entry.id, beforeSnapshot);
    entry.geojson.features.push(newFeature);
    entry.layer.addData(newFeature);
    markLayerDirty(entry.id, true);
    markProjectDirty(true);
    refreshAttributesForEntry(entry);
    if (currentProjectPath) await saveProjectToFile();
    return true;
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

    addMapClickHandler = async (e) => {
      if (activeEditMode !== 'add') return;
      const activeEntry = getEditableLayerEntry();
      if (!activeEntry) return;
      const activeGeomType = getLayerGeometryType(activeEntry);

      if (activeGeomType === 'Point') {
        const added = await addFeatureToEntry(activeEntry, {
          type: 'Point',
          coordinates: [e.latlng.lng, e.latlng.lat],
        });
        if (added) console.log('Edit mode add: point feature added');
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

    const finishSketchForActiveLayer = async () => {
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
      const added = await addFeatureToEntry(activeEntry, geometry);
      if (added) console.log(`Edit mode add: ${activeGeomType} feature added`);
      resetAddSketch();
    };

    addMapDoubleClickHandler = async (e) => {
      if (activeEditMode !== 'add') return;
      L.DomEvent.stop(e);
      await finishSketchForActiveLayer();
    };

    addMapContextMenuHandler = async (e) => {
      if (activeEditMode !== 'add') return;
      L.DomEvent.stop(e);
      await finishSketchForActiveLayer();
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
      const beforeSnapshot = cloneGeoJSON(entry.geojson);

      const feature = entry.geojson.features[idx];
      if (!feature || !feature.geometry || feature.geometry.type !== 'Point') {
        alert('Modify currently supports Point features only.');
        pendingModifyFeatureLayer = null;
        return;
      }

      pushUndoSnapshot(entry.id, beforeSnapshot);
      feature.geometry.coordinates = [e.latlng.lng, e.latlng.lat];
      if (typeof pendingModifyFeatureLayer.setLatLng === 'function') {
        pendingModifyFeatureLayer.setLatLng(e.latlng);
      }
      markLayerDirty(entry.id, true);
      markProjectDirty(true);
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
      const beforeSnapshot = cloneGeoJSON(entry.geojson);

      pushUndoSnapshot(entry.id, beforeSnapshot);
      entry.geojson.features.splice(idx, 1);
      entry.layer.removeLayer(featureLayer);
      markLayerDirty(entry.id, true);
      markProjectDirty(true);
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
        const preferredNameInput = document.getElementById('dialog-file-layer-name');
        if (preferredNameInput && !preferredNameInput.value.trim()) {
          preferredNameInput.value = getFileBaseName(res.path);
        }
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
        const preferredName = (document.getElementById('dialog-file-layer-name').value || '').trim();
        const finalLayerName = preferredName || getFileBaseName(filePath);
        
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
        
        addGeoJSONLayer(transformed, finalLayerName, { sourcePath: filePath });
        
        // Log for debugging
        console.log('File loaded:', { filePath, crs: selectedCRS, swapCoords, numFeatures: parsed.features?.length || 0 });
        
        // Reset for next use
        selectedFileContent = null;
        document.getElementById('dialog-file-path').value = '';
        document.getElementById('dialog-file-layer-name').value = '';
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
      selectedFileContent = null;
      document.getElementById('dialog-file-path').value = '';
      document.getElementById('dialog-file-layer-name').value = '';
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
