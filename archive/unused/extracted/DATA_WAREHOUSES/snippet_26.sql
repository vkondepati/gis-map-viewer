# # Extracted from DATA_WAREHOUSES.md (fence #26, lang='sql')
SELECT name, geometry
FROM features
ORDER BY ST_Distance(geometry, ST_Point(lng, lat))
LIMIT 10
