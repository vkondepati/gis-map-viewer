# # Extracted from DATA_WAREHOUSES.md (fence #28, lang='sql')
SELECT region, COUNT(*) as count
FROM features
GROUP BY region
ORDER BY count DESC
