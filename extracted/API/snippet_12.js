// # Extracted from API.md (fence #12, lang='javascript')
// Select feature
map.selectFeature(featureId);

// Select multiple
map.selectFeatures([id1, id2, id3]);

// Clear selection
map.clearSelection();

// Get selected features
const selected = map.getSelectedFeatures();

// Check if selected
const isSelected = map.isFeatureSelected(featureId);
