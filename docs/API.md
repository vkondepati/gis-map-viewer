# API Reference

Complete API reference for Desktop GIS Map Viewer development.

## Table of Contents

1. [Core Map API](#core-map-api)
2. [Layer Management](#layer-management)
3. [Feature API](#feature-api)
4. [Data Loading](#data-loading)
5. [Spatial Analysis](#spatial-analysis)
6. [Data Warehouse Connectors](#data-warehouse-connectors)
7. [Web Services](#web-services)
8. [Events and Callbacks](#events-and-callbacks)
9. [Code Examples](#code-examples)

---

## Core Map API

### Map Class

**Constructor**

```javascript
// JavaScript
const map = new GISMap({
  container: "map-div",
  center: [0, 0],
  zoom: 2,
  crs: "EPSG:4326",
  style: "light",
});
```

```python
# Python
from gis_viewer import GISMap

map = GISMap(
    container_id='map-div',
    center=(0, 0),
    zoom=2,
    crs='EPSG:4326',
    style='light'
)
```

**Properties**

| Property  | Type       | Description             |
| --------- | ---------- | ----------------------- |
| `center`  | [lon, lat] | Map center coordinates  |
| `zoom`    | number     | Zoom level (0-28)       |
| `crs`     | string     | Current CRS (EPSG code) |
| `bounds`  | object     | Map viewport bounds     |
| `pitch`   | number     | 3D tilt angle (0-60)    |
| `bearing` | number     | Map rotation (0-360)    |

### Map Methods

**Navigation**

```javascript
// Fit map to bounds
map.fitBounds(
  [
    [minLon, minLat],
    [maxLon, maxLat],
  ],
  { padding: 50 },
);

// Zoom to specific level
map.setZoom(5);

// Pan to center
map.panTo([lon, lat]);

// Fly to location
map.flyTo({
  center: [lon, lat],
  zoom: 10,
  duration: 1000, // ms
});

// Reset map
map.reset();
```

**Measurement**

```javascript
// Get distance between points
const distance = map.getDistance([lon1, lat1], [lon2, lat2]);
// Returns: { meters: 1234.5, km: 1.2345, miles: 0.7665 }

// Get area of polygon
const area = map.getArea([
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ],
]);
// Returns: { m2: 12391.5, km2: 0.0124, acres: 3.06 }
```

**Identification**

```javascript
// Get features at point
const features = map.queryFeatures(
  { x: pixelX, y: pixelY },
  {
    layers: ["layer1", "layer2"],
    tolerance: 5,
  },
);

// Get features in area
const features = map.queryAreaFeatures(
  [
    [minLon, minLat],
    [maxLon, maxLat],
  ],
  { layers: ["layer1"] },
);
```

---

## Layer Management

### Layer Class

**Add Layer**

```javascript
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
```

**Layer Properties and Methods**

```javascript
// Get layer
const layer = map.getLayer("my-layer");

// Check if layer visible
const visible = layer.isVisible();

// Set visibility
layer.setVisible(true);

// Set opacity
layer.setOpacity(0.7);

// Get layer data
const geojson = layer.getGeoJSON();

// Get style
const style = layer.getStyle();

// Set style
layer.setStyle({
  fillColor: "#FF0000",
  fillOpacity: 0.5,
  strokeColor: "#000000",
  strokeWidth: 2,
});

// Get feature count
const count = layer.getFeatureCount();

// Delete layer
map.removeLayer("my-layer");
```

**Layer Events**

```javascript
// Layer loaded
layer.on("load", (event) => {
  console.log(`Layer loaded: ${event.layer.name}`);
});

// Layer visibility changed
layer.on("visibilityChanged", (event) => {
  console.log(`Visibility: ${event.visible}`);
});

// Layer style changed
layer.on("styleChanged", (event) => {
  console.log(`Style updated`);
});

// Data updated
layer.on("dataUpdated", (event) => {
  console.log(`${event.featureCount} features updated`);
});
```

### Layer Order

```javascript
// Get layer order
const layerIds = map.getLayerOrder();

// Reorder layers
map.setLayerOrder(["base-map", "features", "overlay"]);

// Move layer to front
map.moveLayerToFront("my-layer");

// Move layer to back
map.moveLayerToBack("my-layer");

// Move layer up/down
map.moveLayerUp("my-layer");
map.moveLayerDown("my-layer");
```

---

## Feature API

### Feature Class

**Create Feature**

```javascript
const feature = map.createFeature({
  geometry: {
    type: "Point",
    coordinates: [-74.006, 40.7128],
  },
  properties: {
    name: "NYC",
    population: 8000000,
  },
});

// Or GeoJSON format
const feature = map.createFeature({
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
  properties: { id: 1, name: "Area 1" },
});
```

**Feature Methods**

```javascript
// Get feature ID
const id = feature.getId();

// Get geometry
const geometry = feature.getGeometry();
// Returns: { type: 'Point', coordinates: [...] }

// Get properties
const props = feature.getProperties();

// Set property
feature.setProperty("name", "New Name");

// Get property
const name = feature.getProperty("name");

// Update geometry
feature.setGeometry({
  type: "Point",
  coordinates: [-73.9, 40.7],
});

// Delete feature
map.deleteFeature(featureId);

// Clone feature
const clone = feature.clone();
```

**Feature Selection**

```javascript
// Select feature
map.selectFeature(featureId);

// Select multiple
map.selectFeatures([id1, id2, id3]);

// Clear selection
map.clearSelection();

// Get selected features
const selected = map.getSelectedFeatures();

// Check if selected
const isSelected = map.isFeatureSelected(featureId);
```

**Batch Operations**

```javascript
// Update multiple features
map.updateFeatures(
  { layer: "my-layer", property: "status", value: "active" },
  { property: "completed", operator: ">", value: "2024-01-01" },
);

// Delete features matching criteria
map.deleteFeatures(
  { layer: "my-layer" },
  { property: "status", operator: "==", value: "inactive" },
);

// Copy features to new layer
map.copyFeatures("source-layer", "dest-layer", { where: "..." });

// Transform features
map.transformFeatures(
  { layer: "my-layer" },
  { operation: "buffer", distance: 100 },
);
```

---

## Data Loading

### DataLoader Class

**Load from File**

```javascript
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
```

**Load from Web Service**

```javascript
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
```

**Data Validation**

```javascript
// Validate geometry
const isValid = loader.validateGeometry(geometry);

// Check for missing values
const hasMissing = loader.hasMissingValues(data);

// Check coordinate range
const inRange = loader.checkCoordinateRange(coordinates, crs);

// Detect CRS
const detectedCRS = loader.detectCRS(data);
```

---

## Spatial Analysis

### Analysis Class

**Buffer**

```javascript
const analysis = new SpatialAnalysis(map);

// Buffer a feature
const buffered = analysis.buffer(feature, {
  distance: 1000, // meters
  resolution: 8, // segments per circle
});

// Buffer multiple features
const bufferedArray = analysis.bufferFeatures(featureArray, {
  distance: 500,
});

// Get result
map.addLayer({
  id: "buffer-result",
  source: buffered.toGeoJSON(),
  type: "GeoJSON",
});
```

**Intersection**

```javascript
// Intersection of two features
const intersection = analysis.intersection(feature1, feature2);

// Intersection with layer
const results = analysis.intersectionWithLayer(feature, "layer-id");

// All intersections
const allIntersections = analysis.allIntersections("layer1", "layer2");
```

**Union**

```javascript
// Union of features
const union = analysis.union([feature1, feature2, feature3]);

// Union with layer
const unionResult = analysis.unionWithLayer(feature, "layer-id");

// Dissolve features by property
const dissolved = analysis.dissolveByProperty("layer-id", "property_name");
```

**Other Operations**

```javascript
// Difference
const diff = analysis.difference(feature1, feature2);

// Symmetric difference
const symDiff = analysis.symmetricDifference(feature1, feature2);

// Simplify geometry
const simplified = analysis.simplify(feature.geometry, {
  tolerance: 0.01,
});

// Reverse geometry
const reversed = analysis.reverse(lineFeature.geometry);

// Check if valid
const isValid = analysis.isValidGeometry(feature.geometry);

// Repair invalid geometry
const repaired = analysis.repairGeometry(invalidFeature.geometry);
```

---

## Data Warehouse Connectors

### DuckDB Connector

```javascript
const connector = new DuckDBConnector({
  filePath: "/data/database.duckdb",
});

// Connect
await connector.connect();

// Query
const result = await connector.query(`
  SELECT * FROM spatial_table 
  WHERE geometry && ST_Envelope(ST_Buffer(ST_Point(0, 0), 1000))
`);

// Get layer
const layer = await connector.getLayer("spatial_table", {
  geometry: "geom",
  filter: 'status = "active"',
});

// Insert data
await connector.insertData("table_name", geojsonData);

// Close connection
await connector.disconnect();
```

### Snowflake Connector

```javascript
const connector = new SnowflakeConnector({
  account: "accountname",
  warehouse: "COMPUTE_WH",
  database: "GIS_DATA",
  schema: "PUBLIC",
  username: "user@example.com",
  password: "password",
});

// Connect
await connector.connect();

// Query
const result = await connector.query(`
  SELECT *, ST_DISTANCE(geometry, ST_POINT(0, 0)) as dist
  FROM geo_table
  WHERE ST_DWITHIN(geometry, ST_POINT(0, 0), 10000)
`);

// Get table metadata
const schema = await connector.getTableSchema("geo_table");

// Create view
await connector.createView(
  "my_view",
  `
  SELECT * FROM geo_table WHERE status = 'active'
`,
);

// Disconnect
await connector.disconnect();
```

### Databricks Connector

```javascript
const connector = new DatabricksConnector({
  workspaceUrl: "https://yourworkspace.cloud.databricks.com",
  token: "dapi...",
  cluster: "cluster-id",
  catalog: "main",
  schema: "default",
});

// Connect
await connector.connect();

// Query with Mosaic library
const result = await connector.query(`
  SELECT id, name, mosaic_explode(geometry) as geometry
  FROM spatial_table
  WHERE mosaic_contains(geometry, ST_Point(0, 0))
`);

// Time travel query (Delta Lake)
const historicalData = await connector.queryVersion("table_name", {
  timestampAsOf: "2024-01-01 10:00:00",
});

// Disconnect
await connector.disconnect();
```

### Apache Iceberg Connector

```javascript
const connector = new IcebergConnector({
  catalogType: "rest",
  uri: "http://localhost:8181",
  warehouse: "s3://mybucket/warehouse",
  s3AccessKey: "AKIAIOSFODNN7EXAMPLE",
  s3SecretKey: "...",
});

// Connect
await connector.connect();

// Query
const result = await connector.query(`
  SELECT * FROM catalog.schema.iceberg_table
`);

// Time travel
const historical = await connector.queryAtTime(
  "table_name",
  "2024-01-01T00:00:00Z",
);

// Get snapshots
const snapshots = await connector.getSnapshots("table_name");

// Checkout snapshot
await connector.checkoutSnapshot("table_name", snapshotId);

// Disconnect
await connector.disconnect();
```

---

## Web Services

### WMS Service

```javascript
const wms = new WMSService({
  url: 'https://wms.example.com/service',
  version: '1.3.0'
});

// Get capabilities
const capabilities = await wms.getCapabilities();
// Returns available layers, CRS, styles, etc.

// Get layer info
const layerInfo = capabilities.getLayer('OSM');

// Get map tile
const image = await wms.getMap({
  layers: ['OSM', 'overlay'],
  bbox: [minLon, minLat, maxLon, maxLat],
  width: 256,
  height: 256,
  crs: 'EPSG:4326',
  format: 'image/png'
});

// Get feature info
const featureInfo = await wms.getFeatureInfo({
  layers: ['data_layer'],
  x: 100,
  y: 100,
  width: 256,
  height: 256,
  bbox: [...],
  info_format: 'application/json'
});
```

### WFS Service

```javascript
const wfs = new WFSService({
  url: "https://wfs.example.com/service",
  version: "2.0.0",
});

// Get capabilities
const capabilities = await wfs.getCapabilities();

// Get feature type
const featureType = capabilities.getFeatureType("my_features");

// Get features
const features = await wfs.getFeatures({
  typeName: "my_features",
  maxFeatures: 1000,
  bbox: [minLon, minLat, maxLon, maxLat],
  outputFormat: "application/json",
});

// Filter features
const filtered = await wfs.getFeatures({
  typeName: "my_features",
  filter:
    "<Filter><PropertyIsGreaterThan><ValueReference>population</ValueReference><Literal>100000</Literal></PropertyIsGreaterThan></Filter>",
});

// Get feature by ID
const feature = await wfs.getFeatureById("my_features", "feature.1");

// Insert feature
const newFeatureId = await wfs.insertFeature("my_features", featureJson);

// Update feature
await wfs.updateFeature("my_features", "feature.1", updatedJson);

// Delete feature
await wfs.deleteFeature("my_features", "feature.1");
```

### WMTS Service

```javascript
const wmts = new WMTSService({
  url: "https://wmts.example.com/service",
  version: "1.0.0",
});

// Get capabilities
const capabilities = await wmts.getCapabilities();

// Get tile
const tile = await wmts.getTile({
  layer: "osm",
  style: "default",
  tilematrixset: "GoogleMapsCompatible_Level8",
  tilematrix: "8",
  tilerow: "85",
  tilecol: "131",
  format: "image/jpeg",
});
```

---

## Events and Callbacks

### Map Events

```javascript
// Map loaded
map.on("load", () => {
  console.log("Map ready");
});

// Zoom changed
map.on("zoomChange", (zoom) => {
  console.log(`New zoom: ${zoom}`);
});

// Pan/move
map.on("move", (center) => {
  console.log(`New center: ${center}`);
});

// Rotation changed
map.on("rotationChange", (bearing) => {
  console.log(`New bearing: ${bearing}`);
});

// Bounds changed
map.on("boundsChange", (bounds) => {
  console.log(`New bounds: ${bounds}`);
});

// Click
map.on("click", (event) => {
  console.log(`Clicked at: ${event.lngLat}`);
  console.log(`Features: ${event.features}`);
});

// Hover
map.on("hover", (event) => {
  console.log(`Hovering over: ${event.features}`);
});

// Selection changed
map.on("selectionChange", (features) => {
  console.log(`Selected ${features.length} features`);
});

// Error
map.on("error", (error) => {
  console.error(`Error: ${error}`);
});
```

### Feature Events

```javascript
feature.on("propertyChange", (event) => {
  console.log(`Property ${event.property} changed to ${event.newValue}`);
});

feature.on("geometryChange", (event) => {
  console.log(`Geometry updated`);
});

feature.on("deleted", (event) => {
  console.log(`Feature deleted`);
});
```

---

## Code Examples

### Complete Example: Load and Analyze Data

**JavaScript**

```javascript
// Create map
const map = new GISMap({
  container: "map-div",
  center: [-74.006, 40.7128],
  zoom: 10,
  crs: "EPSG:4326",
});

// Load data from file
const loader = new DataLoader();
map.addLayer({
  id: "survey-points",
  name: "Survey Points",
  source: "/data/survey.geojson",
  type: "GeoJSON",
  style: {
    fillColor: "#FF0000",
    fillOpacity: 0.7,
  },
});

// Get specific layer
const layer = map.getLayer("survey-points");

// Get selected features
map.on("selectionChange", async (features) => {
  if (features.length > 0) {
    // Run analysis
    const analysis = new SpatialAnalysis(map);
    const buffered = analysis.buffer(features[0], { distance: 1000 });

    // Add result layer
    map.addLayer({
      id: "buffer-result",
      source: buffered.toGeoJSON(),
      type: "GeoJSON",
      style: { strokeColor: "#0000FF" },
    });
  }
});

// Export results
const exportBtn = document.getElementById("export-btn");
exportBtn.addEventListener("click", async () => {
  const features = map.getSelectedFeatures();
  const geojson = { type: "FeatureCollection", features };
  const json = JSON.stringify(geojson, null, 2);

  // Download
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.geojson";
  a.click();
});
```

**Python**

```python
from gis_viewer import GISMap, DataLoader, SpatialAnalysis
import json

# Create map
map = GISMap(
    container_id='map-div',
    center=(-74.0060, 40.7128),
    zoom=10,
    crs='EPSG:4326'
)

# Load data
loader = DataLoader()
geojson = loader.load_geojson('/data/survey.geojson')

# Add layer
map.add_layer({
    'id': 'survey-points',
    'name': 'Survey Points',
    'source': geojson,
    'type': 'GeoJSON',
    'style': {
        'fill_color': '#FF0000',
        'fill_opacity': 0.7
    }
})

# Spatial analysis
layer = map.get_layer('survey-points')
features = layer.get_features()

analysis = SpatialAnalysis(map)
for feature in features:
    buffered = analysis.buffer(feature, {'distance': 1000})
    print(f"Buffered: {buffered}")

# Export
with open('/output/results.geojson', 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': features}, f)
```

---

**Last Updated**: February 2026  
**Documentation Version**: 1.0.0

For more information, see [ARCHITECTURE.md](ARCHITECTURE.md) for system design details.
