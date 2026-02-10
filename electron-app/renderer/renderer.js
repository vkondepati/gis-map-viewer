// Renderer: minimal map app that loads GeoJSON via preload API and displays in Leaflet
let map, baseLayer, currentGeoJsonLayer;

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
        addGeoJSONLayer(parsed, res.path.split(/[\\/]/).pop());
      } catch (err) {
        alert('Failed to parse GeoJSON: ' + err.message);
      }
    }
  });

  document.getElementById('crs-select').addEventListener('change', (ev) => {
    // For now just recreate the map (advanced reprojection would require proj4/proj4leaflet)
    createMap(ev.target.value);
    if (currentGeoJsonLayer) currentGeoJsonLayer.addTo(map);
  });
});
