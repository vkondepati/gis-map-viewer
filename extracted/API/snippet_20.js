// # Extracted from API.md (fence #20, lang='javascript')
// Difference
const diff = analysis.difference(feature1, feature2);

// Symmetric difference
const symDiff = analysis.symmetricDifference(feature1, feature2);

// Simplify geometry
const simplified = analysis.simplify(feature.geometry, {
  tolerance: 0.01,
});

// Reverse geometry
const reversed = analysis.reverse(lineFeature.geometry);

// Check if valid
const isValid = analysis.isValidGeometry(feature.geometry);

// Repair invalid geometry
const repaired = analysis.repairGeometry(invalidFeature.geometry);
