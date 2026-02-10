// # Extracted from DATA_WAREHOUSES.md (fence #10, lang='javascript')
const databricks = new DatabricksConnector({
  host: "dbc-xxxx.cloud.databricks.com",
  token: "dapi...token",
  httpPath: "/sql/1.0/warehouses/warehouse-id",
});
