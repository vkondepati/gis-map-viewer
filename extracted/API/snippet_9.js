// # Extracted from API.md (fence #9, lang='javascript')
// Get layer order
const layerIds = map.getLayerOrder();

// Reorder layers
map.setLayerOrder(["base-map", "features", "overlay"]);

// Move layer to front
map.moveLayerToFront("my-layer");

// Move layer to back
map.moveLayerToBack("my-layer");

// Move layer up/down
map.moveLayerUp("my-layer");
map.moveLayerDown("my-layer");
