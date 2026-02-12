// # Extracted from DATA_WAREHOUSES.md (fence #3, lang='javascript')
duckdb
  .loadTable("cities", {
    geometryColumn: "geom",
    style: { color: "blue", radius: 5 },
  })
  .then((layer) => map.addLayer(layer));
