// # Extracted from DATA_WAREHOUSES.md (fence #6, lang='javascript')
const snowflake = new SnowflakeConnector({
  account: "xy12345.us-east-1",
  user: "gis_user",
  password: "password",
  warehouse: "COMPUTE_WH",
  database: "GIS_DB",
  schema: "PUBLIC",
});
