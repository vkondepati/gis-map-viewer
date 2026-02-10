# Supported Data Formats

Complete reference of all data formats supported by Desktop GIS Map Viewer.

## Table of Contents

- [Vector Formats](#vector-formats)
- [Raster Formats](#raster-formats)
- [Web Services](#web-services)
- [Data Warehouses](#data-warehouses)
- [Format Details](#format-details)

## Vector Formats

Vector data represents geographic features as points, lines, and polygons.

| Format            | Extension        | Read | Write | Description                     |
| ----------------- | ---------------- | ---- | ----- | ------------------------------- |
| **Shapefile**     | .shp, .shx, .dbf | ✅   | ✅    | Industry standard vector format |
| **GeoJSON**       | .geojson, .json  | ✅   | ✅    | RFC 7946 standard, JSON-based   |
| **CSV**           | .csv, .txt       | ✅   | ✅    | Comma-separated with lat/long   |
| **KML**           | .kml             | ✅   | ❌    | Google Earth format             |
| **KMZ**           | .kmz             | ✅   | ❌    | Compressed KML                  |
| **GeoPackage**    | .gpkg            | ✅   | ✅    | SQLite-based, OGC standard      |
| **Shapefile ZIP** | .zip             | ✅   | ❌    | Bundled shapefile components    |
| **GML**           | .gml             | ✅   | ❌    | Geography Markup Language       |
| **WKT/WKB**       | Text/Binary      | ✅   | ✅    | Well-Known Text/Binary formats  |

### Detailed Vector Format Information

#### Shapefile (.shp, .shx, .dbf)

**About**: Industry-standard format developed by Esri. Requires three files working together.

**Files Required**:

- `.shp` - Shape data (geometry)
- `.shx` - Shape index
- `.dbf` - Attribute database

**Optional**:

- `.prj` - Projection/CRS definition (highly recommended)
- `.cpg` - Code page for character encoding

**Capabilities**:

- Supports: Points, Lines, Polygons, MultiPoint, MultiLine, MultiPolygon
- CRS: Auto-detected from .prj file
- Attributes: All standard data types
- Max file size: 2 GB per file

**Import Tips**:

- Ensure all three required files are in same directory
- Place .prj file for automatic CRS detection
- Use Shapefile ZIP if copying multiple files

**Example Loading**:

```
File → Open Data Layer → Select .shp file
```

#### GeoJSON (.geojson, .json)

**About**: Modern, human-readable JSON format. Standard for web GIS.

**Capabilities**:

- Supports: All geometry types
- CRS: WGS 84 by specification (RFC 7946)
- Attributes: All JSON data types (objects, arrays, etc.)
- Features: Supports feature collections

**Structure Example**:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-74.0, 40.7]
      },
      "properties": {
        "name": "New York",
        "population": 8000000
      }
    }
  ]
}
```

**Import Tips**:

- Coordinates must be in WGS 84 (longitude, latitude)
- Properties support any JSON data type
- File can be .geojson or .json

**Example Loading**:

```
File → Open Data Layer → Select .geojson file
```

#### CSV with Coordinates

**About**: Spreadsheet data with latitude and longitude columns.

**Requirements**:

- Must have latitude column (±90)
- Must have longitude column (±180)
- Default CRS: WGS 84

**Configuration**:

1. File → Import CSV
2. Map latitude column
3. Map longitude column
4. Verify CRS is WGS 84
5. Configure feature names if desired
6. Click Import

**Example CSV**:

```csv
name,latitude,longitude,population
"New York",40.7128,-74.0060,8000000
"London",51.5074,-0.1278,9000000
"Tokyo",35.6762,139.6503,37400068
```

#### KML/KMZ

**About**: Google Earth format. KML is XML-based, KMZ is compressed.

**Capabilities**:

- Geometry: Points, Lines, Polygons
- CRS: WGS 84 (Google Earth standard)
- Attributes: Properties and descriptions
- Read-only in this application

**KML Structure**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Location Name</name>
      <Point>
        <coordinates>-74.0,40.7,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>
```

**Example Loading**:

```
File → Open Data Layer → Select .kml or .kmz file
```

#### GeoPackage (.gpkg)

**About**: Modern, standardized geospatial database format based on SQLite.

**Capabilities**:

- Supports: All geometry types
- CRS: Any coordinate system
- Attributes: All data types
- Read/Write: Full support
- Multiple tables: Single file can contain many layers
- Spatial indexing: Built-in for performance

**Advantages**:

- Single file format (easy to share)
- OGC standard
- Works with PostGIS and QGIS
- Built-in spatial index
- Better performance than shapefile

**Example Loading**:

```
File → Open Data Layer → Select .gpkg file
→ Choose table(s) to import
```

## Raster Formats

Raster data represents continuous phenomena as a grid of cells.

| Format       | Extension         | Read | Write | Notes                        |
| ------------ | ----------------- | ---- | ----- | ---------------------------- |
| **GeoTIFF**  | .tif, .tiff       | ✅   | ❌    | Georeferenced TIFF images    |
| **JPEG/PNG** | .jpg, .jpeg, .png | ✅   | ❌    | Basic image support          |
| **ECW**      | .ecw              | ✅   | ❌    | Compressed geospatial images |
| **JPEG2000** | .jp2, .j2k        | ✅   | ❌    | Compressed imagery           |
| **MrSID**    | .sid              | ✅   | ❌    | Multi-resolution images      |

### Raster Format Details

#### GeoTIFF

**About**: Standard georeferenced image format combining TIFF with geospatial metadata.

**Capabilities**:

- Georeferencing: Embedded geographic information
- Bands: Single or multi-band (RGB, multispectral, etc.)
- CRS: Any coordinate system
- Compression: Various compression options

**Use Cases**:

- Aerial/satellite imagery
- Digital elevation models (DEMs)
- Orthophotos
- Base maps

#### JPEG/PNG

**About**: Standard image formats with basic georeferencing support.

**Limitations**:

- No built-in georeferencing (position must be specified)
- Limited metadata support
- Useful as reference images only

## Web Services

Connect to remote mapping services for dynamic data.

| Service Type  | Standard      | Read | Description                           |
| ------------- | ------------- | ---- | ------------------------------------- |
| **WMS**       | OGC 1.1 / 1.3 | ✅   | Web Map Service (rendered images)     |
| **WFS**       | OGC 2.0       | ✅   | Web Feature Service (vector features) |
| **WMTS**      | OGC 1.0       | ✅   | Web Map Tile Service (cached tiles)   |
| **REST API**  | Custom        | ✅   | REST endpoint services                |
| **XYZ Tiles** | Standard URL  | ✅   | Tile-based maps                       |

### Web Service Details

#### WMS (Web Map Service)

**About**: Returns rendered map images from a remote server.

**Setup**:

1. File → Add Web Layer → WMS
2. Enter service URL
3. View available layers
4. Select layers to add
5. Configure parameters

**Example URL**:

```
http://services.example.com/wms?service=WMS&version=1.3.0
```

#### WFS (Web Feature Service)

**About**: Returns actual vector features that you can edit and analyze.

**Setup**:

1. File → Add Web Layer → WFS
2. Enter service URL
3. Choose feature types
4. Configure filter (optional)
5. Configure CRS
6. Load features

**Advantages**:

- Full feature access (not just images)
- Can edit features
- Can query attributes

#### WMTS (Web Map Tile Service)

**About**: Pre-rendered tiles organized in a grid for fast access.

**Common Providers**:

- OpenStreetMap
- Mapbox
- USGS
- Google (with authentication)

#### XYZ Tile Services

**About**: Simple URL-based tile pattern (e.g., for OpenStreetMap).

**Setup**:

1. File → Add Web Layer → XYZ Tiles
2. Enter tile URL: `https://tile.example.com/{z}/{x}/{y}.png`
3. Configure attribution
4. Configure zoom levels
5. Add to map

**Common Patterns**:

- `{z}` = zoom level
- `{x}` = tile column
- `{y}` = tile row

**Example**:

```
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

## Data Warehouses

Query spatial data directly from cloud data platforms.

| Source             | Read | Query Language | Notes                              |
| ------------------ | ---- | -------------- | ---------------------------------- |
| **DuckDB**         | ✅   | SQL            | In-process with spatial extensions |
| **Snowflake**      | ✅   | SQL            | Cloud data warehouse               |
| **Databricks**     | ✅   | SQL            | Apache Spark + Delta Lake          |
| **Apache Iceberg** | ✅   | SQL            | Open table format                  |

See [DATA_WAREHOUSES.md](DATA_WAREHOUSES.md) for detailed information on data warehouse integration.

## Format Details

### Coordinate Systems

**WGS 84 (EPSG:4326)** - Default for most formats:

- Latitude/Longitude in decimal degrees
- ±90 latitude, ±180 longitude
- Standard for GPS and web services

**Web Mercator (EPSG:3857)** - Used by web tiles:

- Projected coordinate system
- Meters as units
- Flat Earth approximation

**Other Supported CRS**:

- UTM zones (Universal Transverse Mercator)
- State Plane coordinates
- Local/regional systems
- 6000+ defined systems

### Attribute Data Types

**Supported Types**:

- String/Text - Character data
- Integer - Whole numbers
- Float/Double - Decimal numbers
- Boolean - True/false
- Date/DateTime - Temporal data
- JSON - Complex objects
- Geometry - Spatial data (WKT/WKB)

### Geometry Types

**Supported Geometries**:

- **Point** - Single location
- **LineString** - Connected line
- **Polygon** - Closed shape
- **MultiPoint** - Multiple points
- **MultiLineString** - Multiple lines
- **MultiPolygon** - Multiple polygons
- **GeometryCollection** - Mixed types

### File Size Limits

- **Shapefile**: 2 GB per file
- **GeoJSON**: Limited by available RAM
- **CSV**: Limited by available RAM
- **GeoPackage**: No practical limit (database)
- **Raster**: Limited by GDAL and available RAM

### Import Settings

**Common Options**:

- **Character Encoding**: UTF-8, ISO-8859-1, others
- **Field Separator**: Comma, tab, pipe, etc. (CSV)
- **CRS Assignment**: Auto-detect or specify
- **Geometry Column**: Select which column(s) contain geometry
- **Feature Name**: Column to use for display
- **Coordinate Order**: X,Y or Y,X

## Data Format Conversion

### Supported Conversions

Export/Save to:

- Shapefile (.shp)
- GeoJSON (.geojson)
- CSV (.csv)
- GeoPackage (.gpkg)
- KML (.kml)

### Export Process

1. Right-click layer in Layers panel
2. Select "Export Layer"
3. Choose format
4. Configure export options:
   - Coordinate system
   - Feature subset (selected only)
   - Geometry type
   - Attribute selection
5. Choose save location
6. Click Export

## Best Practices

### Choosing Formats

| Use Case           | Recommended Format    |
| ------------------ | --------------------- |
| Web applications   | GeoJSON, XYZ tiles    |
| Data sharing       | GeoPackage, Shapefile |
| Attribute editing  | GeoPackage, CSV       |
| Simple vector data | GeoJSON               |
| Large datasets     | GeoPackage, database  |
| Base map imagery   | GeoTIFF, tiles        |
| Collaboration      | GeoPackage            |

### Performance Tips

- Use **GeoPackage** instead of Shapefile for better performance
- Enable **spatial indexes** on large datasets
- Use **WFS with filters** instead of loading all features
- Simplify **geometries** for web services
- Cache **tile services** locally

### Interoperability

- **GDAL/OGR Compatible** - Works with 100+ formats
- **OGC Standards** - Follows open geospatial standards
- **QGIS Compatible** - Can share GeoPackage files with QGIS
- **PostGIS Compatible** - Export to PostgreSQL/PostGIS

---

For data warehouse format details, see [DATA_WAREHOUSES.md](DATA_WAREHOUSES.md).
