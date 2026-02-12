// # Extracted from API.md (fence #14, lang='javascript')
const loader = new DataLoader();

// Load GeoJSON
const geojson = await loader.loadGeoJSON("/data/points.geojson");

// Load Shapefile
const shapeData = await loader.loadShapefile("/data/survey.shp");

// Load CSV with coordinates
const csvData = await loader.loadCSV("/data/locations.csv", {
  latitudeField: "lat",
  longitudeField: "lon",
});

// Load GeoPackage
const gpkgData = await loader.loadGeoPackage("/data/data.gpkg", {
  table: "features",
});

// Load KML
const kml = await loader.loadKML("/data/map.kml");
