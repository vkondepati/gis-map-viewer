# # Extracted from CRS_SUPPORT.md (fence #12, lang='python')
# Iceberg can store CRS as table property
table = catalog.load_table("geometry_table")
table.update_properties({
    "geospatial.crs": "EPSG:4326",
    "geospatial.geometry_column": "geometry"
})
