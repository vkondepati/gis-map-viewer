// # Extracted from API.md (fence #28, lang='javascript')
// Map loaded
map.on("load", () => {
  console.log("Map ready");
});

// Zoom changed
map.on("zoomChange", (zoom) => {
  console.log(`New zoom: ${zoom}`);
});

// Pan/move
map.on("move", (center) => {
  console.log(`New center: ${center}`);
});

// Rotation changed
map.on("rotationChange", (bearing) => {
  console.log(`New bearing: ${bearing}`);
});

// Bounds changed
map.on("boundsChange", (bounds) => {
  console.log(`New bounds: ${bounds}`);
});

// Click
map.on("click", (event) => {
  console.log(`Clicked at: ${event.lngLat}`);
  console.log(`Features: ${event.features}`);
});

// Hover
map.on("hover", (event) => {
  console.log(`Hovering over: ${event.features}`);
});

// Selection changed
map.on("selectionChange", (features) => {
  console.log(`Selected ${features.length} features`);
});

// Error
map.on("error", (error) => {
  console.error(`Error: ${error}`);
});
