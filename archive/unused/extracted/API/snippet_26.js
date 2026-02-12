// # Extracted from API.md (fence #26, lang='javascript')
const wfs = new WFSService({
  url: "https://wfs.example.com/service",
  version: "2.0.0",
});

// Get capabilities
const capabilities = await wfs.getCapabilities();

// Get feature type
const featureType = capabilities.getFeatureType("my_features");

// Get features
const features = await wfs.getFeatures({
  typeName: "my_features",
  maxFeatures: 1000,
  bbox: [minLon, minLat, maxLon, maxLat],
  outputFormat: "application/json",
});

// Filter features
const filtered = await wfs.getFeatures({
  typeName: "my_features",
  filter:
    "<Filter><PropertyIsGreaterThan><ValueReference>population</ValueReference><Literal>100000</Literal></PropertyIsGreaterThan></Filter>",
});

// Get feature by ID
const feature = await wfs.getFeatureById("my_features", "feature.1");

// Insert feature
const newFeatureId = await wfs.insertFeature("my_features", featureJson);

// Update feature
await wfs.updateFeature("my_features", "feature.1", updatedJson);

// Delete feature
await wfs.deleteFeature("my_features", "feature.1");
