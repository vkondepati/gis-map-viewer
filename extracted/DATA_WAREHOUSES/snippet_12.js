// # Extracted from DATA_WAREHOUSES.md (fence #12, lang='javascript')
databricks
  .query(
    `
    SELECT 
      id, 
      name,
      st_geomfromtext(wkt_geom) as geometry
    FROM delta.table_name
    WHERE st_distance(st_geomfromtext(wkt_geom), 
      st_point(${lng}, ${lat})) < 1000
  `,
  )
  .then((features) => map.addData(features));
