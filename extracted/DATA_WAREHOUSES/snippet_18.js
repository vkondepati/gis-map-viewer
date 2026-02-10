// # Extracted from DATA_WAREHOUSES.md (fence #18, lang='javascript')
// Query specific snapshot
iceberg
  .querySnapshot("table_name", snapshotId)
  .then((features) => map.addData(features));

// Query at specific timestamp
iceberg
  .queryAtTimestamp("table_name", "2026-01-15T10:30:00Z")
  .then((features) => map.addData(features));
