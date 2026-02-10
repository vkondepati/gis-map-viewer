// # Extracted from DATA_WAREHOUSES.md (fence #11, lang='javascript')
databricks
  .loadTable("analytics.spatial_data", {
    geometryColumn: "geom",
    useMosaicLibrary: true,
    style: { color: "purple" },
  })
  .then((layer) => map.addLayer(layer));
