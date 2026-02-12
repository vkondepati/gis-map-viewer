// # Extracted from API.md (fence #5, lang='javascript')
// Get features at point
const features = map.queryFeatures(
  { x: pixelX, y: pixelY },
  {
    layers: ["layer1", "layer2"],
    tolerance: 5,
  },
);

// Get features in area
const features = map.queryAreaFeatures(
  [
    [minLon, minLat],
    [maxLon, maxLat],
  ],
  { layers: ["layer1"] },
);
