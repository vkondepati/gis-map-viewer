// # Extracted from API.md (fence #11, lang='javascript')
// Get feature ID
const id = feature.getId();

// Get geometry
const geometry = feature.getGeometry();
// Returns: { type: 'Point', coordinates: [...] }

// Get properties
const props = feature.getProperties();

// Set property
feature.setProperty("name", "New Name");

// Get property
const name = feature.getProperty("name");

// Update geometry
feature.setGeometry({
  type: "Point",
  coordinates: [-73.9, 40.7],
});

// Delete feature
map.deleteFeature(featureId);

// Clone feature
const clone = feature.clone();
