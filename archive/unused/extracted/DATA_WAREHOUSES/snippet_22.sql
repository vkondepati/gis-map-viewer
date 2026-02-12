# # Extracted from DATA_WAREHOUSES.md (fence #22, lang='sql')
SELECT * FROM large_table
WHERE date >= '2026-01-01'
  AND region = 'US-West'
