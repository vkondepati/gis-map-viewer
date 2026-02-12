# # Extracted from DATA_WAREHOUSES.md (fence #5, lang='sql')
-- Buffer
SELECT ST_Buffer(geom, 1000) FROM features;

-- Intersection
SELECT ST_Intersection(a.geom, b.geom)
FROM layer_a a, layer_b b;

-- Distance
SELECT ST_Distance(geom1, geom2) FROM points;

-- Spatial join
SELECT a.*, b.name
FROM layer_a a
JOIN layer_b b ON ST_Intersects(a.geom, b.geom);
