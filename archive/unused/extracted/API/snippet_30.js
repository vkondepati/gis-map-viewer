// # Extracted from API.md (fence #30, lang='javascript')
// Create map
const map = new GISMap({
  container: "map-div",
  center: [-74.006, 40.7128],
  zoom: 10,
  crs: "EPSG:4326",
});

// Load data from file
const loader = new DataLoader();
map.addLayer({
  id: "survey-points",
  name: "Survey Points",
  source: "/data/survey.geojson",
  type: "GeoJSON",
  style: {
    fillColor: "#FF0000",
    fillOpacity: 0.7,
  },
});

// Get specific layer
const layer = map.getLayer("survey-points");

// Get selected features
map.on("selectionChange", async (features) => {
  if (features.length > 0) {
    // Run analysis
    const analysis = new SpatialAnalysis(map);
    const buffered = analysis.buffer(features[0], { distance: 1000 });

    // Add result layer
    map.addLayer({
      id: "buffer-result",
      source: buffered.toGeoJSON(),
      type: "GeoJSON",
      style: { strokeColor: "#0000FF" },
    });
  }
});

// Export results
const exportBtn = document.getElementById("export-btn");
exportBtn.addEventListener("click", async () => {
  const features = map.getSelectedFeatures();
  const geojson = { type: "FeatureCollection", features };
  const json = JSON.stringify(geojson, null, 2);

  // Download
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.geojson";
  a.click();
});
