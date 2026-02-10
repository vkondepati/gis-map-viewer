// # Extracted from API.md (fence #18, lang='javascript')
// Intersection of two features
const intersection = analysis.intersection(feature1, feature2);

// Intersection with layer
const results = analysis.intersectionWithLayer(feature, "layer-id");

// All intersections
const allIntersections = analysis.allIntersections("layer1", "layer2");
