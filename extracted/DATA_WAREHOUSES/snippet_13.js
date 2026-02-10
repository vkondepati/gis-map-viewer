// # Extracted from DATA_WAREHOUSES.md (fence #13, lang='javascript')
databricks
  .queryWithTimestamp("analytics.table_name", "2026-01-15")
  .then((features) => map.addData(features));
