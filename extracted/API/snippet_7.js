// # Extracted from API.md (fence #7, lang='javascript')
// Get layer
const layer = map.getLayer("my-layer");

// Check if layer visible
const visible = layer.isVisible();

// Set visibility
layer.setVisible(true);

// Set opacity
layer.setOpacity(0.7);

// Get layer data
const geojson = layer.getGeoJSON();

// Get style
const style = layer.getStyle();

// Set style
layer.setStyle({
  fillColor: "#FF0000",
  fillOpacity: 0.5,
  strokeColor: "#000000",
  strokeWidth: 2,
});

// Get feature count
const count = layer.getFeatureCount();

// Delete layer
map.removeLayer("my-layer");
