// # Extracted from DATA_WAREHOUSES.md (fence #7, lang='javascript')
snowflake
  .loadTable("countries", {
    geometryColumn: "geom",
    style: { fillColor: "green", weight: 1 },
  })
  .then((layer) => map.addLayer(layer));
