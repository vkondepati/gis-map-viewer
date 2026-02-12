// # Extracted from DATA_WAREHOUSES.md (fence #8, lang='javascript')
snowflake
  .query(
    `
    SELECT id, name, ST_ASGEOJSON(geography_col) as geometry
    FROM spatial_table
    WHERE population > ?
  `,
    [1000000],
  )
  .then((features) => map.addData(features));
