// # Extracted from DATA_WAREHOUSES.md (fence #2, lang='javascript')
const duckdb = new DuckDBConnector({
  database: "path/to/spatial.db",
  // OR for in-memory
  memory: true,
});
