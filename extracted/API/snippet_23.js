// # Extracted from API.md (fence #23, lang='javascript')
const connector = new DatabricksConnector({
  workspaceUrl: "https://yourworkspace.cloud.databricks.com",
  token: "dapi...",
  cluster: "cluster-id",
  catalog: "main",
  schema: "default",
});

// Connect
await connector.connect();

// Query with Mosaic library
const result = await connector.query(`
  SELECT id, name, mosaic_explode(geometry) as geometry
  FROM spatial_table
  WHERE mosaic_contains(geometry, ST_Point(0, 0))
`);

// Time travel query (Delta Lake)
const historicalData = await connector.queryVersion("table_name", {
  timestampAsOf: "2024-01-01 10:00:00",
});

// Disconnect
await connector.disconnect();
