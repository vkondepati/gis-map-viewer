# # Extracted from DATA_WAREHOUSES.md (fence #9, lang='sql')
-- Geometry operations
SELECT ST_BUFFER(geom, 1000) FROM features;

-- Geographic operations (for GEOGRAPHY columns)
SELECT ST_DISTANCE(point1, point2) FROM locations;

-- Spatial relationships
SELECT * FROM areas
WHERE ST_CONTAINS(boundary, location);

-- Spatial joins
SELECT a.*, b.region
FROM data_a a
JOIN data_b b ON ST_INTERSECTS(a.geom, b.geom);
