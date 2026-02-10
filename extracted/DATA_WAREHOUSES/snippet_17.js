// # Extracted from DATA_WAREHOUSES.md (fence #17, lang='javascript')
iceberg
  .loadTable("my_catalog.my_schema.cities", {
    geometryColumn: "geom",
    style: { fillColor: "orange" },
  })
  .then((layer) => map.addLayer(layer));
