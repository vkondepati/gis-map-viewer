// # Extracted from API.md (fence #17, lang='javascript')
const analysis = new SpatialAnalysis(map);

// Buffer a feature
const buffered = analysis.buffer(feature, {
  distance: 1000, // meters
  resolution: 8, // segments per circle
});

// Buffer multiple features
const bufferedArray = analysis.bufferFeatures(featureArray, {
  distance: 500,
});

// Get result
map.addLayer({
  id: "buffer-result",
  source: buffered.toGeoJSON(),
  type: "GeoJSON",
});
