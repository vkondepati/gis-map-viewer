// # Extracted from API.md (fence #19, lang='javascript')
// Union of features
const union = analysis.union([feature1, feature2, feature3]);

// Union with layer
const unionResult = analysis.unionWithLayer(feature, "layer-id");

// Dissolve features by property
const dissolved = analysis.dissolveByProperty("layer-id", "property_name");
