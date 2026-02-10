// # Extracted from API.md (fence #15, lang='javascript')
// Load from WMS
const wmsData = await loader.loadWMS({
  url: "https://wms.example.com/service",
  layer: "OSM",
  bbox: [minLon, minLat, maxLon, maxLat],
  crs: "EPSG:4326",
});

// Load from WFS
const wfsData = await loader.loadWFS({
  url: "https://wfs.example.com/service",
  typeName: "my_features",
  filter:
    "<Filter><PropertyIsEqualTo><ValueReference>status</ValueReference><Literal>active</Literal></PropertyIsEqualTo></Filter>",
});

// Load from XYZ tiles
const tiles = await loader.loadXYZTiles({
  url: "https://tiles.example.com/{z}/{x}/{y}.png",
  minZoom: 0,
  maxZoom: 18,
});
