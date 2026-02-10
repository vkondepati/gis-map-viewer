// # Extracted from DATA_WAREHOUSES.md (fence #15, lang='javascript')
const iceberg = new IcebergConnector({
  engine: "duckdb", // or "spark"
  warehousePath: "s3://my-bucket/iceberg-warehouse",
  catalogType: "hadoop", // or "hive", "rest"
});
