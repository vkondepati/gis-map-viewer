// # Extracted from DATA_WAREHOUSES.md (fence #19, lang='javascript')
iceberg.getTableHistory("table_name").then((history) => {
  history.forEach((v) => {
    console.log(`Snapshot ${v.id}: ${v.timestamp}`);
  });
});
