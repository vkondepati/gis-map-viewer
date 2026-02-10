// # Extracted from CONTRIBUTING.md (fence #8, lang='javascript')
// Good ✅
const result = map.addLayer(layer);
map.on("click", (event) => {
  console.log("Clicked at:", event.latlng);
});

// Bad ❌
let result = map.addLayer(layer);
map.on("click", (event) => {
  console.log("Clicked at:", event.latlng);
});
