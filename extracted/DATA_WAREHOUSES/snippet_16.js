// # Extracted from DATA_WAREHOUSES.md (fence #16, lang='javascript')
const iceberg = new IcebergConnector({
  engine: "duckdb",
  warehousePath: "s3://my-bucket/warehouse",
  catalogType: "rest",
  catalogUri: "http://localhost:8181",
  credentials: {
    accessKeyId: "AKIA...",
    secretAccessKey: "...",
  },
});
