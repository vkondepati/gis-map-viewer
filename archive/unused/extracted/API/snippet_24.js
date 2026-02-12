// # Extracted from API.md (fence #24, lang='javascript')
const connector = new IcebergConnector({
  catalogType: "rest",
  uri: "http://localhost:8181",
  warehouse: "s3://mybucket/warehouse",
  s3AccessKey: "AKIAIOSFODNN7EXAMPLE",
  s3SecretKey: "...",
});

// Connect
await connector.connect();

// Query
const result = await connector.query(`
  SELECT * FROM catalog.schema.iceberg_table
`);

// Time travel
const historical = await connector.queryAtTime(
  "table_name",
  "2024-01-01T00:00:00Z",
);

// Get snapshots
const snapshots = await connector.getSnapshots("table_name");

// Checkout snapshot
await connector.checkoutSnapshot("table_name", snapshotId);

// Disconnect
await connector.disconnect();
