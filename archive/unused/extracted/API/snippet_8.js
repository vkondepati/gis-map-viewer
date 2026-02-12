// # Extracted from API.md (fence #8, lang='javascript')
// Layer loaded
layer.on("load", (event) => {
  console.log(`Layer loaded: ${event.layer.name}`);
});

// Layer visibility changed
layer.on("visibilityChanged", (event) => {
  console.log(`Visibility: ${event.visible}`);
});

// Layer style changed
layer.on("styleChanged", (event) => {
  console.log(`Style updated`);
});

// Data updated
layer.on("dataUpdated", (event) => {
  console.log(`${event.featureCount} features updated`);
});
