// # Extracted from API.md (fence #22, lang='javascript')
const connector = new SnowflakeConnector({
  account: "accountname",
  warehouse: "COMPUTE_WH",
  database: "GIS_DATA",
  schema: "PUBLIC",
  username: "user@example.com",
  password: "password",
});

// Connect
await connector.connect();

// Query
const result = await connector.query(`
  SELECT *, ST_DISTANCE(geometry, ST_POINT(0, 0)) as dist
  FROM geo_table
  WHERE ST_DWITHIN(geometry, ST_POINT(0, 0), 10000)
`);

// Get table metadata
const schema = await connector.getTableSchema("geo_table");

// Create view
await connector.createView(
  "my_view",
  `
  SELECT * FROM geo_table WHERE status = 'active'
`,
);

// Disconnect
await connector.disconnect();
