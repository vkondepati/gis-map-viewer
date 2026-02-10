# Desktop GIS Map Viewer

A comprehensive desktop application for viewing, analyzing, and editing geospatial data from various sources.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Formats](#supported-formats)
- [Data Warehouse and Data Lake Integration](#data-warehouse-and-data-lake-sources)
- [Architecture](#architecture)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Editing Features](#editing-features)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

The Desktop GIS Map Viewer is a cross-platform application designed for geospatial professionals, GIS analysts, and developers who need to visualize, analyze, and edit geographic data. The application provides an intuitive interface for working with multiple GIS data sources simultaneously.

### Key Capabilities

- **Multi-format data ingestion** from various GIS sources
- **Native WGS 84 (EPSG:4326) support** for global geographic coordinates
- **Data warehouse integration** with DuckDB, Snowflake, Databricks, and Iceberg
- **Real-time visualization** with interactive map controls
- **Spatial analysis tools** for identifying and selecting features
- **Geometry editing** with full CRUD operations
- **Web service integration** for OGC-compliant REST APIs
- **Layer management** with customizable styling

### Coordinate Reference System (CRS) Support

#### WGS 84 (EPSG:4326)

The application has native support for **WGS 84 (World Geodetic System 1984)**, the standard geographic coordinate system used globally.

**WGS 84 Specifications**:

- **Type**: Geographic (spherical coordinates)
- **Unit**: Decimal degrees
- **Latitude Range**: -90° (South Pole) to +90° (North Pole)
- **Longitude Range**: -180° (West) to +180° (East)
- **Common Uses**: GPS data, CSV/Excel files with lat/long, GeoJSON, web services
- **Decimal Precision Guide**:
  - 1 decimal place: ~11 km precision
  - 2 decimal places: ~1.1 km precision
  - 3 decimal places: ~111 m precision
  - 4 decimal places: ~11 m precision
  - 5 decimal places: ~1.1 m precision
  - 6 decimal places: ~0.11 m (11 cm) precision

#### Supported CRS Transformations

The application automatically transforms between coordinate systems:

- **Geographic CRS**: WGS 84, NAD83, ETRS89, etc.
- **Projected CRS**: Web Mercator (EPSG:3857), UTM zones, State Plane, etc.
- **Local/Regional CRS**: Custom coordinate systems via PROJ4 definitions

#### Automatic CRS Detection

When loading data:

- Shapefiles: CRS read from .prj file (if present)
- GeoJSON: Defaults to WGS 84 per RFC 7946 standard
- KML/KMZ: WGS 84 by specification
- CSV Files: Defaults to WGS 84 for lat/long columns
- Web Services: CRS provided by service metadata

## Features

### Map Navigation and Interaction

#### Zoom Controls

- **Zoom In/Out**: Use mouse scroll wheel or toolbar buttons to change scale
- **Fit to Extent**: Automatically zoom to show all loaded layers
- **Zoom to Selection**: Focus map on selected features
- **Predefined Scales**: Quick access to common scale levels (1:1000, 1:5000, 1:10000, etc.)

#### Pan Operations

- **Click and Drag**: Direct pan across the map using mouse
- **Arrow Keys**: Use keyboard for precise panning
- **Pan Tool**: Dedicated tool for seamless panning mode
- **Smart Boundaries**: Prevent panning beyond world extent

#### Identify Feature

- **Point Query**: Click on map to identify feature at location
- **Feature Info Panel**: Display all attributes of identified features
- **Multiple Results**: Handle overlapping features with result list
- **Attribute Inspector**: View and edit feature properties

#### Selection Tools

- **Point Selection**: Select single feature by clicking
- **Rectangle Selection**: Drag to define selection area
- **Polygon Selection**: Create custom selection boundary
- **Free-hand Selection**: Draw selection boundary freehand
- **Select by Attribute**: Query features based on attribute values
- **Invert Selection**: Toggle between selected and unselected features
- **Clear Selection**: Deselect all features

### Layer Management

#### Layer Operations

- **Add Layers**: Load data from file system or web services
- **Remove Layers**: Delete layers from map
- **Reorder Layers**: Change drawing order via drag-and-drop
- **Toggle Visibility**: Show/hide individual layers
- **Layer Groups**: Organize layers hierarchically
- **Layer Properties**: Configure opacity, blend modes, and display settings

#### Styling and Symbology

- **Symbology Settings**: Configure colors, line styles, fill patterns
- **Classified Rendering**: Style features based on attribute values
- **Graduated Colors**: Create color ramps for continuous data
- **Unique Values**: Apply different symbols for discrete categories
- **Data-driven Styling**: Bind visual properties to attributes

### Data Source Integration

#### Vector Data

- **Shapefile**: Load .shp, .shx, .dbf files (automatic CRS detection)
- **GeoJSON**: Direct import of .geojson and .json files (WGS 84 by default)
- **CSV/Excel**: Files with latitude/longitude columns (WGS 84 compatible)
- **KML/KMZ**: Keyhole Markup Language formats (WGS 84 standard)
- **GeoPackage**: SQLite-based geospatial data (supports any CRS including WGS 84)

#### Web Services

- **WMS (Web Map Service)**: Stream map images from servers (WGS 84 compatible)
- **WFS (Web Feature Service)**: Query and download vector features (automatic CRS transformation)
- **WMTS (Web Map Tile Service)**: Cached tile-based maps (Web Mercator/WGS 84)
- **REST APIs**: Custom OGC REST service endpoints (CRS-aware requests)
- **Tile Services**: XYZ tile servers (OSM, Mapbox, etc. - Web Mercator based)

#### Raster Data

- **GeoTIFF**: Georeferenced image data
- **ECW/JPEG2000**: Compressed geospatial images
- **MrSID**: Multi-resolution Seamless Image Database

## Supported Formats

### Vector Formats

| Format        | Extension        | Capabilities | Notes                        |
| ------------- | ---------------- | ------------ | ---------------------------- |
| Shapefile     | .shp, .shx, .dbf | Read/Write   | All geometry types supported |
| GeoJSON       | .geojson, .json  | Read/Write   | RFC 7946 compliant           |
| KML           | .kml             | Read         | Google Earth format          |
| KMZ           | .kmz             | Read         | Compressed KML               |
| CSV           | .csv, .txt       | Read         | With lat/long columns        |
| GeoPackage    | .gpkg            | Read/Write   | SQLite-based                 |
| Shapefile ZIP | .zip             | Read         | Bundled shapefiles           |

### Raster Formats

| Format   | Extension   | Capabilities      |
| -------- | ----------- | ----------------- |
| GeoTIFF  | .tif, .tiff | Read-only         |
| JPEG/PNG | .jpg, .png  | Read-only (basic) |
| ECW      | .ecw        | Read-only         |
| JPEG2000 | .jp2        | Read-only         |

### Web Services

| Service Type | Protocol             | Description            |
| ------------ | -------------------- | ---------------------- |
| WMS          | OGC WMS 1.1/1.3      | Rendered map images    |
| WFS          | OGC WFS 2.0          | Vector feature access  |
| WMTS         | OGC WMTS 1.0         | Pre-rendered tile sets |
| REST API     | Custom Endpoints     | Vector/Raster services |
| XYZ Tiles    | Standard URL Pattern | Tile-based maps        |

### Data Warehouse and Data Lake Sources

| Source                   | Capabilities                    | Connection Type  | Notes                                       |
| ------------------------ | ------------------------------- | ---------------- | ------------------------------------------- |
| **DuckDB**               | Read/Query spatial tables       | Direct/SQL       | In-process database with spatial extensions |
| **Snowflake**            | Read spatial data (ST_GEOMETRY) | Cloud Connection | Scalable cloud data warehouse               |
| **Databricks**           | Read Delta Lake tables          | Cloud Connection | Apache Spark-based with spatial support     |
| **Apache Iceberg**       | Read Iceberg tables             | SQL Query Engine | Open table format with time travel          |
| **PostgreSQL + PostGIS** | Read/Write spatial queries      | Direct SQL       | On-premises or cloud database               |

#### DuckDB Integration

- Query spatial data directly from DuckDB tables
- Support for DuckDB spatial extension (DuckDB-SPATIAL)
- Efficient in-memory spatial operations
- JSON/Parquet export to GIS formats

#### Snowflake Integration

- Connect to Snowflake warehouse
- Query GEOGRAPHY and GEOMETRY columns
- Support for ST_GEOMETRY spatial functions
- Automatic pagination for large datasets

#### Databricks Integration

- Connect to Databricks clusters
- Query Delta Lake tables with geospatial data
- Support for Databricks' Mosaic library
- Integration with Spark SQL spatial functions

#### Apache Iceberg Integration

- Read Iceberg tables from compatible engines
- Time-travel queries for historical spatial data
- Schema evolution support
- Integration with DuckDB or Spark engines

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                   │
│  (Map Canvas, Toolbars, Panels, Dialogs)                │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                       │
│  (Event Handling, State Management, User Commands)       │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    Services Layer                         │
│  (Layer Management, Projection, Symbology)               │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                       │
│  (File I/O, Web Services, Spatial Indexing)              │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Desktop Framework Options

- **Electron** (JavaScript/TypeScript) - Cross-platform, web technologies
- **Qt** (C++) - Native performance, professional GIS applications
- **WPF** (.NET) - Windows-native rich UI
- **PyQt/PySide** (Python) - Rapid development, data science integration

#### Mapping Libraries

- **Leaflet** - Lightweight JavaScript mapping
- **OpenLayers** - Feature-rich web GIS library
- **Mapbox GL JS** - Modern vector tile rendering
- **GDAL/OGR** - Geospatial data abstraction layer
- **Proj4** - Cartographic projection library

#### Data Processing

- **GDAL** - Read/write GIS formats
- **GEOS** - Geometric operations
- **Spatialite** - Spatial SQL database
- **Turf.js** - Geospatial analysis

#### Database Support

- **SQLite + Spatialite** - Lightweight local storage
- **PostGIS** - PostgreSQL spatial extension
- **GeoPackage** - SQLite-based standard format

## System Requirements

### Minimum Requirements

- **OS**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **CPU**: Dual-core 2.0 GHz processor
- **RAM**: 4 GB minimum (8 GB recommended)
- **Storage**: 500 MB free disk space
- **Display**: 1280 × 720 minimum resolution

### Recommended Requirements

- **OS**: Windows 11, macOS 12+, Ubuntu 20.04+
- **CPU**: Quad-core 2.5+ GHz processor
- **RAM**: 16 GB
- **GPU**: Dedicated graphics card for large datasets
- **Storage**: SSD with 2+ GB available space

### Network Requirements

- Internet connection for web service access
- Support for HTTPS connections

## Installation

### From Release Package

1. **Download** the installer for your OS from releases page
2. **Run** the installer and follow on-screen instructions
3. **Launch** the application from desktop shortcut or applications menu

### From Source

#### Prerequisites

```bash
# Node.js and npm
node --version  # v16.0+
npm --version   # v8.0+

# Or Python environment
python --version  # 3.8+
pip --version
```

#### Build Steps

```bash
# Clone repository
git clone https://github.com/yourusername/gis-map-viewer.git
cd gis-map-viewer

# Install dependencies
npm install
# OR
pip install -r requirements.txt

# Run development server
npm start
# OR
python -m gis_viewer

# Build executable
npm run build
# OR
pyinstaller gis_viewer.spec
```

## Usage Guide

### Starting the Application

1. **Launch** the GIS Map Viewer application
2. **Welcome Screen** appears with options to:
   - Create new project
   - Open recent projects
   - Open from file system

### Loading Data

#### From File System

```
Menu: File → Open Data Layer
1. Browse to data file (.shp, .geojson, .csv, etc.)
2. Select file and click Open
3. Configure data import settings if prompted
4. Layer appears in Layers panel and on map
```

#### From Web Service

```
Menu: File → Add Web Layer
1. Select service type (WMS, WFS, WMTS, REST API)
2. Enter service URL
3. Review available layers
4. Select layers to add
5. Configure parameters
6. Click Add to Map
```

#### From CSV File with Coordinates

```
Menu: File → Import CSV
1. Select CSV file
2. Configure column mappings:
   - Latitude column
   - Longitude column
   - (Optional) Feature name column
3. Set coordinate reference system (CRS)
4. Preview data
5. Click Import
```

#### From Data Warehouse

##### DuckDB

```
Menu: File → Add Data Warehouse Layer → DuckDB
1. Select DuckDB file or create new in-memory database
2. Enter SQL query to retrieve spatial data:
   - SELECT geom_column, attribute_columns FROM table_name
3. Specify geometry column name
4. Configure CRS if not standard WGS 84
5. Click Load
```

##### Snowflake

```
Menu: File → Add Data Warehouse Layer → Snowflake
1. Enter Snowflake connection details:
   - Account identifier (xy12345.region)
   - Username and password
   - Warehouse, Database, Schema
2. Select or write SQL query:
   - SELECT ST_ASGEOJSON(geography_col) FROM table_name
3. Configure pagination (if large dataset)
4. Click Connect and Load
```

##### Databricks

```
Menu: File → Add Data Warehouse Layer → Databricks
1. Enter Databricks workspace details:
   - Workspace host
   - Personal access token
   - SQL warehouse/cluster HTTP path
2. Enter SQL query on Delta Lake table
3. Optionally enable Mosaic library for spatial operations
4. Click Load
```

##### Apache Iceberg

```
Menu: File → Add Data Warehouse Layer → Iceberg
1. Configure Iceberg catalog:
   - Catalog type (Hadoop, Hive, REST)
   - Warehouse path (S3, local, etc.)
2. Select table from catalog browser
3. Optionally select specific snapshot (for time-travel)
4. Configure spatial geometry column
5. Click Load
```

### Map Navigation

| Action            | Method                                           |
| ----------------- | ------------------------------------------------ |
| Zoom In           | Mouse scroll up OR Toolbar button OR +/= key     |
| Zoom Out          | Mouse scroll down OR Toolbar button OR - key     |
| Pan               | Click+Drag OR Arrow keys                         |
| Fit Extent        | Toolbar button OR Menu: View → Fit All Layers    |
| Zoom to Selection | Toolbar button OR Menu: View → Zoom to Selection |

### Identifying Features

1. **Click** "Identify Tool" in toolbar (or press 'I')
2. **Click** on map feature
3. **Feature Info Panel** displays:
   - Feature geometry type
   - All attribute values
   - Spatial coordinates
4. **Double-click** attribute to edit (if editing enabled)

### Selecting Features

#### Rectangle Selection

1. Click "Rectangle Select" tool
2. Click+Drag to define selection area
3. Selected features highlight on map
4. Selection appears in Layers panel

#### Query by Attribute

1. Right-click layer in Layers panel
2. Select "Query Layer"
3. Enter WHERE clause (e.g., `population > 10000`)
4. Click Execute
5. Matching features selected

#### Clear Selection

- Menu: Edit → Clear Selection
- Or click "Clear" in Layers panel

### Layer Management

#### Adding a Layer

```
1. File → Open Data Layer
2. Browse and select file
3. Click Open
4. Layer appears in Layers panel
```

#### Removing a Layer

```
1. Right-click layer in Layers panel
2. Click "Remove Layer"
3. Confirm removal
```

#### Changing Layer Order

```
1. Click layer in Layers panel
2. Drag up/down to reorder
3. Map refreshes automatically
```

#### Styling a Layer

```
1. Right-click layer in Layers panel
2. Click "Properties"
3. Go to "Symbology" tab
4. Configure:
   - Fill color / Pattern
   - Line color / Width / Style
   - Label text and font
5. Click Apply
```

### Spatial Queries

#### Buffer Analysis

```
Menu: Analysis → Buffer
1. Select layer to buffer
2. Set buffer distance (in map units)
3. Choose output location
4. Click Execute
5. New buffered layer created
```

#### Intersection Analysis

```
Menu: Analysis → Intersection
1. Select two layers
2. Configure output fields
3. Click Execute
4. Result layer created
```

#### Distance Measurement

```
1. Click "Measure" tool
2. Click points on map to measure
3. Distance displayed in status bar
4. Right-click to finish
```

## API Reference

### Core Objects

#### Map

```javascript
// Create map instance (defaults to WGS 84 for geographic coordinates)
const map = new GISMap(containerId, {
  crs: "EPSG:4326", // WGS 84 (latitude, longitude in decimal degrees)
  defaultCRS: "EPSG:4326", // Default CRS for data import
});

// Map control methods (supports WGS 84 coordinates)
map.setCenter(lat, lng, zoom); // lat, lng in WGS 84
map.fitExtent(extent); // extent in map CRS
map.addLayer(layer);
map.removeLayer(layerId);

// Map events
map.on("click", (event) => {
  console.log(event.latlng); // WGS 84 coordinates
});
```

#### Layer

```javascript
// Create layer from file
const layer = new VectorLayer({
  name: "cities",
  url: "data/cities.geojson",
  style: { color: "red", weight: 2 },
});

// Layer methods
layer.setStyle(styleObject);
layer.setOpacity(0.5);
layer.show();
layer.hide();
layer.queryFeatures(filter);

// Layer events
layer.on("featureSelected", (feature) => {
  console.log(feature.properties);
});
```

#### Feature

```javascript
// Get feature
const feature = layer.getFeature(featureId);

// Feature properties
feature.geometry; // GeoJSON geometry
feature.properties; // Attribute values
feature.bounds; // Feature extent

// Feature methods
feature.setProperty(key, value);
feature.delete();
feature.updateGeometry(newGeometry);
```

### Service Methods

#### DataLoader

```javascript
// Load vector data
DataLoader.loadShapefile("path/to/file.zip").then((geojson) =>
  map.addData(geojson),
);

// Load GeoJSON (WGS 84 coordinates expected per RFC 7946)
DataLoader.loadGeoJSON("data.geojson").then(
  (geojson) => map.addData(geojson), // Automatically WGS 84
);

// Load CSV with WGS 84 coordinates (latitude/longitude in decimal degrees)
DataLoader.loadCSV("data.csv", {
  latColumn: "latitude", // Latitude column (-90 to 90)
  lngColumn: "longitude", // Longitude column (-180 to 180)
  crs: "EPSG:4326", // WGS 84 (default)
}).then((geojson) => map.addData(geojson));
```

#### WebServiceConnector

```javascript
// Connect to WMS service with WGS 84 support
const wms = new WMSConnector({
  url: "http://service.example.com/wms",
  version: "1.3.0",
  crs: "EPSG:4326", // Request WGS 84 projection
});

wms.getCapabilities().then((capabilities) => console.log(capabilities.layers));

wms.addLayer("layer_name");

// Connect to WFS service
const wfs = new WFSConnector({
  url: "http://service.example.com/wfs",
});

wfs
  .getFeatures("layer_name", {
    bbox: extent,
    propertyName: ["name", "population"],
  })
  .then((features) => console.log(features));
```

#### SpatialAnalysis

```javascript
// Buffer operation
SpatialAnalysis.buffer(layer, 1000, "meters").then((result) =>
  map.addLayer(result),
);

// Intersection
SpatialAnalysis.intersection(layer1, layer2).then((result) =>
  map.addLayer(result),
);

// Union
SpatialAnalysis.union(layer1, layer2).then((result) => map.addLayer(result));

// Within query
SpatialAnalysis.within(layer, polygon).then((features) =>
  console.log(features),
);
```

### Data Warehouse and Data Lake Connectors

#### DuckDB Connector

```javascript
// Connect to DuckDB database
const duckdb = new DuckDBConnector({
  database: "path/to/spatial.db", // Local DuckDB file
  // OR for in-memory
  memory: true,
});

// Query spatial data
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

// Load table as layer
duckdb
  .loadTable("cities", {
    geometryColumn: "geom",
    style: { color: "blue", radius: 5 },
  })
  .then((layer) => map.addLayer(layer));
```

#### Snowflake Connector

```javascript
// Connect to Snowflake warehouse
const snowflake = new SnowflakeConnector({
  account: "xy12345.us-east-1",
  user: "gis_user",
  password: "password",
  warehouse: "COMPUTE_WH",
  database: "GIS_DB",
  schema: "PUBLIC",
});

// Query spatial data
snowflake
  .query(
    `
    SELECT id, name, ST_ASGEOJSON(geography_col) as geometry
    FROM spatial_table
    WHERE ST_WITHIN(geography_col, 
      TO_GEOGRAPHY('POLYGON((lng1 lat1, lng2 lat2, ...))'))
  `,
  )
  .then((features) => {
    const geojson = snowflake.toGeoJSON(features);
    map.addData(geojson);
  });

// Load table with pagination
snowflake
  .loadTable("countries", {
    geometryColumn: "geom",
    pageSize: 10000,
    style: { fillColor: "green", weight: 1 },
  })
  .then((layer) => map.addLayer(layer));

// Get available spatial tables
snowflake.getSpatialTables().then((tables) => console.log(tables));
```

#### Databricks Connector

```javascript
// Connect to Databricks workspace
const databricks = new DatabricksConnector({
  host: "dbc-xxxx.cloud.databricks.com",
  token: "dapi...token",
  httpPath: "/sql/1.0/warehouses/warehouse-id",
});

// Query Delta Lake with spatial data
databricks
  .query(
    `
    SELECT id, name, st_geomfromtext(wkt_geom) as geometry
    FROM delta.table_name
    WHERE st_distance(st_geomfromtext(wkt_geom), 
      st_point(${lng}, ${lat})) < 1000
  `,
  )
  .then((features) => {
    const geojson = databricks.toGeoJSON(features);
    map.addData(geojson);
  });

// Load Delta Lake table
databricks
  .loadTable("analytics.spatial_data", {
    geometryColumn: "geom",
    useMosaicLibrary: true, // Enable Databricks Mosaic for spatial ops
    style: { color: "purple" },
  })
  .then((layer) => map.addLayer(layer));

// Query time-travel (previous versions of data)
databricks
  .queryWithTimestamp("table_name", timestamp)
  .then((features) => map.addData(features));
```

#### Apache Iceberg Connector

```javascript
// Connect to Iceberg tables via DuckDB engine
const iceberg = new IcebergConnector({
  engine: "duckdb", // or "spark"
  warehousePath: "s3://my-bucket/iceberg-warehouse",
  catalogType: "hadoop", // or "hive", "rest"
});

// Query Iceberg table
iceberg
  .query(
    `
    SELECT id, name, geom as geometry
    FROM my_catalog.my_schema.spatial_table
    WHERE date_col >= current_date - 7
  `,
  )
  .then((features) => {
    const geojson = iceberg.toGeoJSON(features);
    map.addData(geojson);
  });

// Load Iceberg table as layer
iceberg
  .loadTable("my_catalog.my_schema.cities", {
    geometryColumn: "geom",
    style: { fillColor: "orange" },
  })
  .then((layer) => map.addLayer(layer));

// Time-travel query (access data from specific snapshot)
iceberg
  .querySnapshot("table_name", snapshotId, {
    where: "population > 100000",
  })
  .then((features) => map.addData(features));

// Get table schema and metadata
iceberg
  .getTableSchema("my_catalog.my_schema.table_name")
  .then((schema) => console.log(schema));
```

## Editing Features

### Creating New Features

#### Create Point

```
1. Click "Create Point" tool
2. Click on map to place point
3. Enter attributes in popup dialog
4. Click Save
```

#### Create Line

```
1. Click "Create Line" tool
2. Click multiple points on map
3. Double-click or press Enter to finish
4. Enter attributes in dialog
5. Click Save
```

#### Create Polygon

```
1. Click "Create Polygon" tool
2. Click points to define boundary
3. Double-click or press Enter to finish
4. Enter attributes in dialog
5. Click Save
```

### Modifying Existing Features

#### Edit Geometry

```
1. Click "Edit Feature" tool
2. Click feature on map
3. Geometry vertices appear
4. Drag vertices to modify shape
5. Add vertices by clicking edge
6. Delete vertices by clicking them
7. Click Save when done
```

#### Edit Attributes

```
1. Identify feature (press 'I', click feature)
2. In Feature Info panel, click Edit
3. Modify attribute values
4. Click Save
```

#### Delete Feature

```
1. Identify feature
2. In Feature Info panel, click Delete
3. Confirm deletion
```

### Batch Operations

#### Batch Attribute Update

```
Menu: Edit → Batch Update
1. Select layer to update
2. Enter WHERE clause for features
3. Set new attribute values
4. Preview changes
5. Click Apply
```

#### Transform Geometries

```
Menu: Edit → Transform
1. Select layer and features
2. Choose transformation:
   - Rotate (enter angle)
   - Scale (enter factor)
   - Translate (enter offsets)
3. Preview result
4. Click Apply
```

### Validation

#### Check Geometry Validity

```
Menu: Tools → Validate Geometries
1. Select layer
2. Validator checks for:
   - Self-intersecting polygons
   - Invalid coordinate ranges
   - Topology issues
3. Report generated with issues
4. Option to auto-fix common problems
```

#### Repair Geometries

```
Menu: Tools → Repair Geometries
1. Select layer with issues
2. Choose repair strategy:
   - Snap to grid
   - Remove self-intersections
   - Close open rings
3. Preview changes
4. Apply repairs
```

## Configuration

### User Preferences

#### Display Settings

```
Menu: Edit → Preferences → Display
- Default zoom level: [1-20]
- Background color: [Color picker]
- Draw layer labels: [Toggle]
- Draw feature outlines: [Toggle]
- Raster resampling: Nearest/Linear/Cubic
```

#### Performance Settings

```
Menu: Edit → Preferences → Performance
- Max features to render: [Slider]
- Cache tile images: [Toggle]
- Simplify geometries: [Toggle]
  - Simplification tolerance: [Value in map units]
- Progressive loading: [Toggle]
```

#### Default Formats

```
Menu: Edit → Preferences → Data
- Default export format: Shapefile/GeoJSON/CSV
- Default coordinate system: [CRS selector] - Default: WGS 84 (EPSG:4326)
- Decimal places in output: [1-10]
- Date format: [ISO 8601/US/EU]
- WGS 84 decimal precision: [Configurable latitude/longitude precision]
```

#### Data Warehouse Connections

```
Menu: Edit → Preferences → Data Warehouses
- Manage connection profiles for DuckDB, Snowflake, Databricks, Iceberg
- Each connection can be saved with credentials or environment variables

DuckDB Settings:
- Database file path (or in-memory)
- Auto-load spatial extensions
- Query timeout (default: 300s)

Snowflake Settings:
- Account identifier, warehouse, database
- Authentication method (password/SSO)
- Query timeout, result fetch size

Databricks Settings:
- Workspace host and access token
- Warehouse/cluster selection
- Query timeout, max partition size

Iceberg Settings:
- Catalog type and warehouse path
- Storage configuration (S3, HDFS, local)
- Default schema for table discovery
```

### Project Files

#### Creating a Project

```
File → New Project
1. Enter project name and location
2. Set default coordinate system
3. Optionally add initial layers
4. Project saved as .gisproject file
```

#### Project Structure

```
MyProject.gisproject/
├── project.xml          # Metadata
├── layers/              # Layer definitions
├── styles/              # Layer styles
└── data/                # Local data copies
```

#### Saving Project

```
File → Save Project
- Saves current map state
- Includes all layers and styles
- Preserves viewport extent and zoom
- Recent projects accessible from File menu
```

## Troubleshooting

### Common Issues

#### Shapefile Not Loading

**Problem**: "Invalid shapefile" error

**Solutions**:

- Ensure all three files (.shp, .shx, .dbf) are present
- Files must be in same directory
- Check file permissions
- Try opening as Shapefile ZIP instead

#### Slow Performance with Large Files

**Problem**: Map is slow, jerky, or unresponsive

**Solutions**:

- Reduce visible layers (hide unnecessary layers)
- Enable geometry simplification (Preferences → Performance)
- Increase simplification tolerance
- Convert to GeoPackage for better performance
- Create spatial index on data
- Use tiles instead of vector layer for base maps

#### Web Service Not Connecting

**Problem**: "Connection failed" or timeout errors

**Solutions**:

- Verify internet connection
- Check service URL is correct
- Ensure service is accessible (not behind firewall/proxy)
- Check service requires authentication
- Try CORS proxy if cross-origin issue
- Review service status page

#### Coordinate System Issues

**Problem**: Features appear in wrong location

**Solutions**:

- Verify source CRS is correctly set
- For geographic data with lat/long: Use WGS 84 (EPSG:4326)
- For map display: Project to Web Mercator (EPSG:3857)
- Check layer CRS matches map CRS (automatic reprojection available)
- Re-import data with correct CRS specified
- Use Tools → Assign CRS if missing
- WGS 84 is recommended for CSV imports with latitude/longitude columns

#### Data Warehouse Connection Issues

**Problem**: "Cannot connect to DuckDB/Snowflake/Databricks" error

**Solutions**:

##### DuckDB

- Verify database file path exists and is readable
- Check file permissions and disk space
- For in-memory databases, ensure enough RAM available
- Verify spatial extensions are installed: `INSTALL spatial; LOAD spatial;`
- Check query syntax and table names

##### Snowflake

- Verify account identifier format (e.g., xy12345.us-east-1)
- Check username and password/token credentials
- Ensure warehouse is running and accessible
- Verify user has permissions on database and schema
- Check network connectivity to Snowflake cloud
- Ensure spatial columns use GEOGRAPHY or GEOMETRY type
- Review Snowflake query history for timeout or error details

##### Databricks

- Verify workspace URL is correct (no trailing slash)
- Check personal access token is valid and not expired
- Ensure SQL warehouse or cluster is running
- Verify user has permissions on tables and schemas
- Check HTTP path is correct for SQL warehouse/cluster
- Ensure Delta table includes geometry columns
- Test connection with simple SELECT query first

##### Apache Iceberg

- Verify catalog type matches configuration (Hadoop/Hive/REST)
- Check warehouse path permissions (S3, HDFS, local)
- For S3: verify AWS credentials and bucket access
- Ensure Iceberg tables exist in catalog
- Verify table namespace and schema names
- Check snapshot ID exists (for time-travel queries)
- Test with DuckDB Iceberg extension: `SELECT * FROM iceberg_scan('path')`

#### Large Dataset Performance

**Problem**: Slow queries and long loading times from data warehouses

**Solutions**:

- Limit query results with WHERE clause to specific regions/time periods
- Use pagination for large result sets
- Enable geometry simplification after loading
- Create indexed columns in source database for spatial predicates
- Cache query results locally as GeoPackage
- Use data warehouse view instead of table for filtered data
- Optimize geometry column storage format in source system

#### Memory Errors

**Problem**: "Out of memory" when loading large datasets

**Solutions**:

- Reduce page size in pagination settings
- Stream data instead of loading all at once
- Use spatial filters to load only visible extent
- Simplify geometries before rendering
- Clear previous layer caches
- Increase application memory limits in settings
- Consider exporting subset of data to local format

## Memory Usage Increasing

**Problem**: Application becomes slower over time

**Solutions**:

- Close unused layers
- Clear undo history (Edit → Clear History)
- Restart application
- Reduce maximum feature count (Preferences)
- Disable layer caching for large datasets
- Consider splitting large files
- Disconnect from remote data warehouses when not in use

### Debug Mode

Enable debug logging:

```
Menu: Help → Debug Options → Enable Debug Logging
- Creates debug.log file in application directory
- Logs all operations for troubleshooting
- Useful for reporting issues
```

### Getting Help

- **Documentation**: Built-in help system (Press F1)
- **Online Help**: https://gis-map-viewer.readthedocs.io
- **Community Forum**: https://github.com/yourusername/gis-map-viewer/discussions
- **Bug Reports**: https://github.com/yourusername/gis-map-viewer/issues
- **Email Support**: support@example.com

## Project Files and Documentation

### Essential Open-Source Files

Every open-source project should include these files:

#### README.md

The entry point for new users and contributors:

- Project description and features
- Quick start guide
- Installation instructions
- Basic usage examples
- Links to full documentation
- Information about license and contributions
- Credits and acknowledgments

#### LICENSE

Legal document specifying usage rights:

- **MIT License** (recommended for this project): Permissive, business-friendly
- **Apache 2.0**: Permissive with patent protection
- **GPL v3**: Copyleft (requires sharing modifications)
- **AGPL v3**: Copyleft (requires sharing even in network context)

Full MIT License text should be in this file.

#### CONTRIBUTING.md

Guidelines for contributing to the project:

- Development setup instructions
- Code style and standards
- Testing requirements
- Pull request process
- Commit message conventions
- How to report bugs
- How to request features
- Code of conduct reference

#### CODE_OF_CONDUCT.md

Community standards and expectations:

- Project values and inclusivity statement
- Expected behavior
- Unacceptable behavior
- Enforcement and consequences
- Reporting procedures
- Contact information for violations

**Recommended template**: Contributor Covenant (https://www.contributor-covenant.org/)

#### CHANGELOG.md

History of changes and releases:

- Version numbers and release dates
- Features added in each version
- Bug fixes
- Breaking changes
- Deprecation notices
- Migration guides for major versions

#### SECURITY.md

Guidelines for security issue reporting:

- How to report security vulnerabilities
- Do NOT disclose vulnerabilities publicly
- Expected response timeline
- Patch and release process
- Security update policy

#### .gitignore

Files to exclude from version control:

- Node modules and dependencies
- Build artifacts
- IDE configuration
- OS-specific files
- Secrets and environment files

#### package.json / setup.py

Project manifest and dependencies:

- Project name, version, description
- Author and license information
- Dependencies and their versions
- Build and test scripts
- Repository links

#### .github/workflows/

Automated CI/CD pipelines:

- Unit test execution
- Integration tests
- Code coverage reporting
- Linting and code quality
- Automated releases
- Documentation building

### Repository Structure

```
.github/
├── workflows/
│   ├── ci.yml           # Continuous integration
│   ├── release.yml      # Automated releases
│   └── docs.yml         # Build documentation
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
└── PULL_REQUEST_TEMPLATE.md

docs/
├── index.rst            # Main documentation
├── user-guide/
├── developer-guide/
├── api/
├── examples/
└── _config.yml          # ReadTheDocs configuration

src/                      # Source code

tests/                    # Test suite

examples/                 # Example projects and scripts

.github/workflows/        # Automated workflows

CONTRIBUTING.md          # How to contribute

CODE_OF_CONDUCT.md      # Community guidelines

CHANGELOG.md            # Version history

LICENSE                 # License text

README.md               # Project overview

SECURITY.md             # Security reporting

.gitignore              # Files to ignore

package.json            # Node.js config

setup.py                # Python config
```

### GitHub Configuration

#### Repository Settings

- **Description**: Clear, searchable project description
- **Topics**: Add relevant tags (gis, mapping, geospatial, etc.)
- **README**: Display prominent on home page
- **License**: Select MIT from license dropdown
- **Funding links**: Add to .github/FUNDING.yml

#### Branch Protection

- Require pull request reviews
- Dismiss stale reviews when commits pushed
- Require status checks to pass
- Require branches up to date before merge
- Restrict who can push to protected branch

#### Labels for Issues

Create standardized labels:

- `bug` - Something isn't working
- `feature` - New feature request
- `documentation` - Docs improvement
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority/critical` - Critical priority
- `type/question` - Question about usage
- `type/enhancement` - Enhancement request
- `status/in-progress` - Currently being worked on
- `status/blocked` - Work blocked by other issues

#### Issue Templates

Create templates for:

- Bug reports
- Feature requests
- Documentation improvements

#### Pull Request Template

```markdown
## Description

Brief description of changes

## Related Issues

Fixes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How was this tested?

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No new warnings generated
```

## Advanced Features

### Custom Styling with Style Files

#### SLD (Styled Layer Descriptor)

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0">
  <NamedLayer>
    <Name>cities</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Transformation>
          <ogc:Function name="ras:Jiffle">
            <ogc:Literal>dest = src1 + src2;</ogc:Literal>
          </ogc:Function>
        </Transformation>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
```

### Scripting and Automation

#### Python Console

```
Menu: Tools → Python Console

# Access map object
map.fitExtent([-180, -90, 180, 90])

# Load and style layer
layer = map.addLayer('cities.geojson')
layer.setStyle({'color': 'red', 'weight': 3})

# Spatial query
results = layer.queryFeatures({
    'population': {'$gt': 100000}
})
```

### Integration with External Tools

#### Export Capabilities

- **Shapefile**: Full vector export with attributes
- **GeoJSON**: Standard format for web services
- **GeoPackage**: SQLite-based container
- **KML/KMZ**: Google Earth compatible
- **CSV**: Tabular with coordinates
- **Image**: PNG/JPEG at current zoom

#### Import from External Sources

- QGIS projects (.qgs)
- ArcGIS layers (.lyr)
- Mapbox GL styles
- Web layer definitions

## Development

### Development Environment Setup

#### Prerequisites

- Git 2.20+
- Node.js 16+ or Python 3.8+
- Docker (optional, for testing)

#### Clone Repository

```bash
git clone https://github.com/yourusername/gis-map-viewer.git
cd gis-map-viewer
```

#### JavaScript/Electron Setup

```bash
# Install dependencies
npm install

# Install dev dependencies
npm install --save-dev

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Create installers
npm run dist
```

#### Python Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linter and formatter
flake8 .
black .
```

### Project Structure

```
gis-map-viewer/
├── src/
│   ├── main/              # Main application code
│   ├── renderer/          # UI rendering (Electron)
│   ├── lib/               # Core libraries
│   │   ├── connectors/    # Data source connectors
│   │   ├── spatial/       # Spatial operations
│   │   └── utils/         # Utilities
│   └── styles/            # CSS/SCSS styles
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test data
├── docs/                  # Documentation
├── examples/              # Example projects
├── scripts/               # Build and utility scripts
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
├── CONTRIBUTING.md        # Contribution guidelines
├── CODE_OF_CONDUCT.md     # Community code of conduct
├── LICENSE                # License file
└── README.md              # Project README
```

### Building from Source

#### JavaScript/Electron Build

```bash
# Development build
npm run dev

# Production build
npm run build

# Create distribution packages
npm run dist  # Creates installers for all platforms
npm run dist:win    # Windows only
npm run dist:mac    # macOS only
npm run dist:linux  # Linux only
```

#### Python Build

```bash
# Create executable
pyinstaller gis_viewer.spec

# Create wheel package
python setup.py bdist_wheel

# Install locally in development mode
pip install -e .
```

### Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/spatial.test.js

# Watch mode (re-run on file change)
npm test -- --watch
```

#### Test Structure

```
tests/
├── unit/
│   ├── spatial.test.js    # Spatial operations
│   ├── io.test.js         # File I/O
│   ├── crs.test.js        # Coordinate system
│   └── ui.test.js         # UI components
├── integration/
│   ├── duckdb.test.js     # DuckDB integration
│   ├── snowflake.test.js  # Snowflake integration
│   └── workflows.test.js  # User workflows
└── fixtures/
    ├── data/              # Sample GIS data
    └── mocks/             # Mock services
```

#### Code Coverage Goals

- Overall: >80% coverage
- Core libraries: >90% coverage
- UI components: >70% coverage

### Continuous Integration

#### GitHub Actions Workflows

```yaml
# .github/workflows/ci.yml
- Unit tests on every push
- Integration tests on PRs
- Code coverage reporting
- Linting and code quality checks
- Build for all platforms (Windows, macOS, Linux)
- Automated releases on version tags
```

#### Running CI Locally

```bash
# Run all CI checks
npm run ci

# Components:
npm run lint        # Linting
npm run test        # Tests
npm run build       # Build
npm run coverage    # Code coverage
```

### Code Style and Standards

#### JavaScript/TypeScript

```bash
# Format code
npm run format

# Check linting
npm run lint

# Fix linting errors
npm run lint:fix
```

Configuration files:

- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Code formatting rules
- `tsconfig.json` - TypeScript configuration

#### Python

```bash
# Format with Black
black .

# Check style with Flake8
flake8 .

# Type checking with mypy
mypy .
```

#### Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:

```
feat(spatial): add buffer operation for polygons

Implements ST_Buffer functionality using GEOS.
Closes #123
```

### Documentation

#### Building Docs Locally

```bash
# Install Sphinx
pip install sphinx sphinx-rtd-theme

# Build HTML docs
cd docs && make html

# View at docs/_build/html/index.html
```

#### Documentation Structure

```
docs/
├── conf.py              # Sphinx configuration
├── index.rst            # Main documentation
├── user-guide/          # User documentation
├── developer-guide/     # Developer documentation
├── api/                 # API reference
└── examples/            # Code examples
```

### Debugging

#### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Specific module
DEBUG=gis-viewer:spatial npm run dev
```

#### Browser DevTools

```bash
# Open DevTools
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (macOS)
```

#### Remote Debugging

```bash
# With debugger
node --inspect-brk src/main.js

# Connect debugger to chrome://inspect
```

## Contributing

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a branch** for your feature: `git checkout -b feature/amazing-feature`
4. **Follow the development setup** instructions above
5. **Make your changes** and test thoroughly
6. **Commit with conventional messages**: `git commit -m "feat: describe your feature"`
7. **Push to your fork**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** describing your changes

### Contribution Guidelines

#### Code Contributions

- **Follow code style** - Use provided ESLint/Black configurations
- **Write tests** - Aim for >80% coverage on new code
- **Update documentation** - Keep docs in sync with code changes
- **One feature per PR** - Keep PRs focused and manageable
- **Descriptive commit messages** - Use conventional commits format

#### Documentation Contributions

- **Fix typos and clarity** issues
- **Add examples** for features
- **Translate documentation** to other languages
- **Improve API docs** with better descriptions

#### Bug Reports

Submit an issue with:

- **Description** of the bug
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **System information** (OS, version, etc.)
- **Screenshots** if applicable

#### Feature Requests

Submit an issue with:

- **Description** of the feature
- **Use case** and motivation
- **Possible implementation** ideas
- **Links** to related issues/PRs

### Code Review Process

1. **Automated checks**: CI/CD pipeline runs tests and linting
2. **Code review**: Maintainers review code quality and design
3. **Feedback**: Reviewers request changes if needed
4. **Approval**: Once approved, maintainers merge the PR
5. **Release notes**: Changes are documented in changelog

### Commit Access and Releases

- **Core contributors** get push access after 2-3 quality contributions
- **Releases** follow semantic versioning (MAJOR.MINOR.PATCH)
- **Release process**:
  1. Update version in package.json
  2. Update CHANGELOG.md
  3. Create git tag
  4. GitHub Actions builds and publishes
  5. Release notes posted on GitHub Releases

### Community Standards

#### Code of Conduct

This project adopts the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

We are committed to:

- **Respectful communication** - Treat all members with respect
- **Inclusive environment** - Welcome people of all backgrounds
- **Professional conduct** - Focus on the project's mission
- **Constructive feedback** - Provide helpful and actionable critique

#### Reporting Issues

If you experience unacceptable behavior:

1. Document the incident
2. Email: conduct@example.com
3. Our team will respond within 72 hours
4. Maintain confidentiality throughout process

### Support and Questions

- **GitHub Discussions** - Ask questions and discuss ideas
- **Stack Overflow** - Tag questions with `gis-map-viewer`
- **Issue Tracker** - Report bugs and request features
- **Community Chat** - Join our Discord server
- **Email** - Contact team@example.com

## Roadmap

### Vision

Build the world's leading open-source desktop GIS viewer that is:

- **Accessible** to professionals and beginners alike
- **Performant** for large datasets
- **Extensible** through plugins and APIs
- **Community-driven** with transparent governance

### Release Schedule

#### Version 1.0 (Q2 2026) - Current Focus

- [x] Core mapping functionality
- [x] Vector data support (Shapefile, GeoJSON)
- [x] Web service integration (WMS/WFS)
- [x] Data warehouse connectors (DuckDB, Snowflake, Databricks, Iceberg)
- [ ] Comprehensive documentation
- [ ] Stable API release

#### Version 1.1 (Q3 2026)

- [ ] 3D visualization (Cesium.js integration)
- [ ] Advanced spatial analysis tools
- [ ] Raster data processing
- [ ] Plugin system
- [ ] Performance optimizations for large datasets

#### Version 1.2 (Q4 2026)

- [ ] Real-time collaboration features
- [ ] Time-series data animation
- [ ] Advanced styling (data-driven visualizations)
- [ ] Mobile companion app
- [ ] Offline mode with synchronization

#### Version 2.0 (2027)

- [ ] Cloud-native architecture
- [ ] AI-powered feature detection
- [ ] Custom workflow builders
- [ ] Enterprise features (LDAP, auditing)
- [ ] Market ecosystem (3rd-party plugins)

### Feature Proposals

#### High Priority

- [ ] GeoPackage write support
- [ ] Vector tile (MVT) support
- [ ] PostGIS advanced features
- [ ] REST API for headless operation
- [ ] Batch processing capabilities
- [ ] Advanced styling with expressions

#### Medium Priority

- [ ] LiDAR point cloud visualization
- [ ] Time-aware queries
- [ ] Machine learning model integration
- [ ] Advanced geocoding
- [ ] Network analysis tools

#### Future Considerations

- [ ] Augmented Reality visualization
- [ ] Blockchain-based data verification
- [ ] IoT sensor integration
- [ ] Quantum geospatial computing
- [ ] Advanced computer vision features

### How to Influence Roadmap

1. **Vote on GitHub Discussions** - Community voting drives priority
2. **Sponsor features** - Organizations can sponsor development
3. **Submit RFCs** - Request for Comments for major features
4. **Join governance** - Become a core contributor or maintainer

### Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.

## Governance

### Project Leadership

- **Creator/BDFL**: Your Name (benevolent dictator for life)
- **Core Team**: 3-5 active maintainers
- **Steering Committee**: 5-7 members (includes community representatives)

### Decision Making

- **Consensus**: Aim for consensus on major decisions
- **Voting**: If consensus fails, use weighted voting
- **Transparency**: All decisions documented publicly

### Roles and Responsibilities

#### Maintainers

- Review and merge pull requests
- Release new versions
- Respond to critical issues
- Represent project in community

#### Triagers

- Review and label new issues
- Respond to bug reports
- Help route contributions

#### Contributors

- Submit bug reports and feature requests
- Contribute code and documentation
- Help test releases
- Participate in discussions

### Becoming a Maintainer

**Requirements**:

- 6+ months active participation
- 10+ merged pull requests
- Deep familiarity with codebase
- Commitment to project values
- Endorsement by existing maintainers

**Process**:

1. Nominated by current maintainer
2. Discussed in steering committee
3. Approved by consensus
4. Formal announcement

## Licensing and Credits

### License

This project is licensed under the **MIT License** - permissive open-source license that allows:

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Must include license and copyright notice

See [LICENSE](LICENSE) file for full text.

### Open-Source Dependencies

Built on the shoulders of giants:

**Mapping Libraries**:

- Leaflet (BSD 2-Clause)
- OpenLayers (BSD 2-Clause)
- Mapbox GL JS (Mapbox Terms of Service)

**Geospatial Libraries**:

- GDAL/OGR (MIT/Apache 2.0)
- GEOS (LGPL 2.1)
- Proj4 (MIT)

**Data Formats**:

- shapefile (MIT)
- geojsonl (MIT)
- turf.js (MIT)

**Data Processing**:

- DuckDB (MIT)
- Apache Arrow (Apache 2.0)
- NumPy/SciPy (BSD)

**Database Drivers**:

- snowflake-connector (Apache 2.0)
- databricks-sql-connector (Databricks)
- psycopg2 (LGPL/BSD)

**Web Services**:

- axios (MIT)
- xml2js (MIT)

**Testing**:

- Jest (MIT)
- pytest (MIT)
- mocha (MIT)

**Build Tools**:

- webpack (MIT)
- Electron (MIT)
- pyinstaller (GPL/PyInstaller License)

### Acknowledgments

Special thanks to:

- **QGIS Project** - Inspiration and community
- **PostGIS Team** - Spatial database pioneering
- **GDAL/OGR Community** - Geospatial data handling
- **Leaflet.js Team** - Lightweight mapping
- **Contributors** - Everyone who has contributed code, documentation, and bug reports

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Changelog

### Version 1.0.0 (Initial Release)

- Core mapping functionality
- Shapefile and GeoJSON support
- WMS/WFS integration
- Basic editing tools
- Layer management
- WGS 84 coordinate system support
- Data warehouse integration (DuckDB, Snowflake, Databricks, Iceberg)

### Version 1.1.0 (Planned)

- 3D visualization
- Advanced spatial analysis tools
- Raster processing
- Real-time collaboration
- Plugin system

## Community

### Get Involved

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and discuss ideas
- **Discord Server**: Join our community chat (link to Discord)
- **Twitter**: Follow updates @gis_map_viewer
- **Blog**: Read tutorials and news at blog.example.com

### Events

- **Monthly community calls** - Discuss roadmap and priorities
- **Weekly office hours** - Get help with development
- **Annual conference** - Community celebration and learning
- **Hackathons** - Build features together

## Credits

Built with open-source libraries including:

- GDAL/OGR
- GEOS
- Proj4
- Leaflet/OpenLayers
- Qt Framework
- DuckDB
- Apache Arrow

### Sponsors

Organizations supporting this project:

- [Your Organization Name]
- [Partner Organizations]

### How to Sponsor

Support the project by:

- **Donating** - Help sustain development
- **Sponsoring features** - Fund specific development
- **Corporate sponsorship** - Become a major sponsor
- **In-kind contributions** - Provide services or resources

Contact: sponsors@example.com

---

**Last Updated**: February 2026
**Current Version**: 1.0.0-beta
**Repository**: https://github.com/yourusername/gis-map-viewer
**Issues**: https://github.com/yourusername/gis-map-viewer/issues
**Discussions**: https://github.com/yourusername/gis-map-viewer/discussions
**Maintainers**: Your Name and Contributors
