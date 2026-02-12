// # Extracted from API.md (fence #25, lang='javascript')
const wms = new WMSService({
  url: 'https://wms.example.com/service',
  version: '1.3.0'
});

// Get capabilities
const capabilities = await wms.getCapabilities();
// Returns available layers, CRS, styles, etc.

// Get layer info
const layerInfo = capabilities.getLayer('OSM');

// Get map tile
const image = await wms.getMap({
  layers: ['OSM', 'overlay'],
  bbox: [minLon, minLat, maxLon, maxLat],
  width: 256,
  height: 256,
  crs: 'EPSG:4326',
  format: 'image/png'
});

// Get feature info
const featureInfo = await wms.getFeatureInfo({
  layers: ['data_layer'],
  x: 100,
  y: 100,
  width: 256,
  height: 256,
  bbox: [...],
  info_format: 'application/json'
});
