// # Extracted from API.md (fence #21, lang='javascript')
const connector = new DuckDBConnector({
  filePath: "/data/database.duckdb",
});

// Connect
await connector.connect();

// Query
const result = await connector.query(`
  SELECT * FROM spatial_table 
  WHERE geometry && ST_Envelope(ST_Buffer(ST_Point(0, 0), 1000))
`);

// Get layer
const layer = await connector.getLayer("spatial_table", {
  geometry: "geom",
  filter: 'status = "active"',
});

// Insert data
await connector.insertData("table_name", geojsonData);

// Close connection
await connector.disconnect();
