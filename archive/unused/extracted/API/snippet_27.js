// # Extracted from API.md (fence #27, lang='javascript')
const wmts = new WMTSService({
  url: "https://wmts.example.com/service",
  version: "1.0.0",
});

// Get capabilities
const capabilities = await wmts.getCapabilities();

// Get tile
const tile = await wmts.getTile({
  layer: "osm",
  style: "default",
  tilematrixset: "GoogleMapsCompatible_Level8",
  tilematrix: "8",
  tilerow: "85",
  tilecol: "131",
  format: "image/jpeg",
});
