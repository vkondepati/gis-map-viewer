// # Extracted from API.md (fence #10, lang='javascript')
const feature = map.createFeature({
  geometry: {
    type: "Point",
    coordinates: [-74.006, 40.7128],
  },
  properties: {
    name: "NYC",
    population: 8000000,
  },
});

// Or GeoJSON format
const feature = map.createFeature({
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
  properties: { id: 1, name: "Area 1" },
});
