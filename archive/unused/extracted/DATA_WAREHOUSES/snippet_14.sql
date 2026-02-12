# # Extracted from DATA_WAREHOUSES.md (fence #14, lang='sql')
SELECT
  id,
  mosaic_geom_to_geojson(geom) as geometry
FROM features
WHERE mosaic_st_contains(boundary, geom)
