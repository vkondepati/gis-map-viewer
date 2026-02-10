// # Extracted from DATA_WAREHOUSES.md (fence #4, lang='javascript')
duckdb
  .query(
    `
    SELECT id, name, ST_AsGeoJSON(geom) as geometry
    FROM buildings
    WHERE ST_Contains(geom, ST_Point(?, ?))
  `,
    [lng, lat],
  )
  .then((results) => {
    const geojson = duckdb.toGeoJSON(results);
    map.addData(geojson);
  });
