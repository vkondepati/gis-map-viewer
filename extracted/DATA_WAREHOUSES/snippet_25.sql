# # Extracted from DATA_WAREHOUSES.md (fence #25, lang='sql')
-- Load only features in bounding box
SELECT * FROM features
WHERE longitude BETWEEN -180 AND 180
  AND latitude BETWEEN -90 AND 90
