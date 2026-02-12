# # Extracted from DATA_WAREHOUSES.md (fence #27, lang='sql')
SELECT a.*, b.region_name
FROM features a
JOIN regions b ON ST_Intersects(a.geometry, b.geometry)
