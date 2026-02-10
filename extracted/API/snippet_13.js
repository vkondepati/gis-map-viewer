// # Extracted from API.md (fence #13, lang='javascript')
// Update multiple features
map.updateFeatures(
  { layer: "my-layer", property: "status", value: "active" },
  { property: "completed", operator: ">", value: "2024-01-01" },
);

// Delete features matching criteria
map.deleteFeatures(
  { layer: "my-layer" },
  { property: "status", operator: "==", value: "inactive" },
);

// Copy features to new layer
map.copyFeatures("source-layer", "dest-layer", { where: "..." });

// Transform features
map.transformFeatures(
  { layer: "my-layer" },
  { operation: "buffer", distance: 100 },
);
