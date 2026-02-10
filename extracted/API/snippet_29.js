// # Extracted from API.md (fence #29, lang='javascript')
feature.on("propertyChange", (event) => {
  console.log(`Property ${event.property} changed to ${event.newValue}`);
});

feature.on("geometryChange", (event) => {
  console.log(`Geometry updated`);
});

feature.on("deleted", (event) => {
  console.log(`Feature deleted`);
});
