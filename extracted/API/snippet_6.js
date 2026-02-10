// # Extracted from API.md (fence #6, lang='javascript')
// From file
map.addLayer({
  id: "my-layer",
  name: "Survey Points",
  source: "/data/points.geojson",
  type: "GeoJSON",
});

// From data warehouse
map.addLayer({
  id: "warehouse-layer",
  name: "Snowflake Data",
  source: {
    type: "snowflake",
    connection: "prod-warehouse",
    query: "SELECT * FROM geo_table",
    geometry: "geom",
  },
});

// From web service
map.addLayer({
  id: "wms-layer",
  name: "OpenStreetMap",
  source: {
    type: "wms",
    url: "https://wms.example.com/service",
    layer: "osm:layer",
    style: "default",
  },
});
