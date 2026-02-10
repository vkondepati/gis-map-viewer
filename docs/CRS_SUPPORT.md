# Coordinate Reference System (CRS) Support

Complete guide to coordinate systems, projections, and spatial reference systems in Desktop GIS Map Viewer.

## Table of Contents

1. [CRS Fundamentals](#crs-fundamentals)
2. [WGS 84 (EPSG:4326)](#wgs-84-epsg4326)
3. [Supported Coordinate Systems](#supported-coordinate-systems)
4. [Working with CRS](#working-with-crs)
5. [CRS Transformation](#crs-transformation)
6. [Accuracy and Precision](#accuracy-and-precision)
7. [Common CRS by Region](#common-crs-by-region)
8. [CRS in Data Warehouses](#crs-in-data-warehouses)

---

## CRS Fundamentals

### What is a Coordinate Reference System?

A Coordinate Reference System (CRS), also called Spatial Reference System (SRS), defines how coordinates on Earth are represented and related to actual locations.

**Components**:

1. **Datum**: Mathematical model of Earth's shape
   - Defines the surface coordinates are measured from
   - Different datums for different regions/purposes
   - WGS 84 is global standard

2. **Ellipsoid**: Shape representing Earth
   - Earth is not a perfect sphere
   - Approximated as ellipsoid
   - Different ellipsoids for different regions

3. **Projection**: Method to flatten Earth to 2D
   - Geographic coordinates (lat/lon) to planar (x/y)
   - Different projections for different uses
   - No projection preserves all properties

4. **Units**: How coordinates are measured
   - Degrees (geographic)
   - Meters (projected)
   - Feet, survey feet, etc.

### Geographic vs Projected CRS

**Geographic CRS**

- Coordinates: Latitude (N/S), Longitude (E/W)
- Units: Degrees (°)
- Range: Lat [-90, 90], Lon [-180, 180]
- Properties: No distortion at poles
- Use: Global data, web services
- Example: WGS 84 (EPSG:4326)

**Projected CRS**

- Coordinates: X (Easting), Y (Northing)
- Units: Meters (typical)
- Properties: Minimize distortion for specific region
- Use: Local surveys, precise measurements
- Example: UTM Zone 33N (EPSG:32633)

### EPSG Codes

EPSG (European Petroleum Survey Group) codes uniquely identify CRS.

**Format**: `EPSG:NNNN` where NNNN is numeric code

**Common Codes**:

- `EPSG:4326`: WGS 84 (geographic)
- `EPSG:3857`: Web Mercator (projected)
- `EPSG:32633`: UTM Zone 33N (projected)
- `EPSG:2154`: Lambert 93 (France)
- `EPSG:3995`: Arctic Polar Stereographic

Find codes at: https://epsg.io/

---

## WGS 84 (EPSG:4326)

### Overview

**WGS 84** (World Geodetic System 1984) is the global standard for geographic data.

**Properties**:

- **EPSG Code**: 4326
- **Authority**: EPSG (European Petroleum Survey Group)
- **Name**: WGS 84
- **Type**: Geographic CRS
- **Datum**: WGS 84 ellipsoid
- **Units**: Degrees
- **Accuracy**: ±5 meters globally (satisfactory for most applications)
- **Adoption**: GPS standard, web services, international data

### Coordinate System

**Latitude (Y)**

- North: +1° to +90°
- South: -1° to -90°
- Equator: 0°

**Longitude (X)**

- East: +1° to +180°
- West: -1° to -180°
- Prime Meridian: 0° (Greenwich)

**Example Coordinates**:

```
New York:      40.7128°N, 74.0060°W (or 40.7128, -74.0060)
London:        51.5074°N, 0.1278°W (or 51.5074, -0.1278)
Sydney:        33.8688°S, 151.2093°E (or -33.8688, 151.2093)
Equator/Prime: 0°, 0°
Equator/IDL:   0°, ±180°
```

### Accuracy in WGS 84

**Distance Measurement Accuracy**

- At equator: 1° longitude = 111.32 km
- At 45° latitude: 1° longitude = 78.85 km
- At poles: 1° longitude = 0 km

**Precision Guidelines**

| Decimal Places | Distance Precision | Use Case       |
| -------------- | ------------------ | -------------- |
| 0 (1°)         | ~111 km            | Country-level  |
| 1 (0.1°)       | ~11 km             | Region-level   |
| 2 (0.01°)      | ~1.1 km            | City-level     |
| 3 (0.001°)     | ~111 m             | Neighborhood   |
| 4 (0.0001°)    | ~11 m              | Building       |
| 5 (0.00001°)   | ~1.1 m             | Survey feature |
| 6 (0.000001°)  | ~0.11 m (11 cm)    | Precise survey |
| 7+             | < 11 cm            | GPS/RTK survey |

### WGS 84 in Desktop GIS Viewer

**Default CRS**: Application defaults to EPSG:4326

**Automatic Detection**:

- When loading data without CRS, assumes WGS 84
- Can be overridden in layer properties

**Web Services**:

- Most web services use WGS 84 or Web Mercator
- Application automatically handles conversion

**Advantages for Application**:

- No projection distortion globally
- Compatible with GPS devices
- Standard for web mapping
- Simplifies data integration
- Good for worldwide visualization

---

## Supported Coordinate Systems

### Geographic CRS (Most Common)

| EPSG Code | Name        | Region        | Accuracy | Use                 |
| --------- | ----------- | ------------- | -------- | ------------------- |
| 4326      | WGS 84      | Global        | ±5m      | Standard, GPS       |
| 4269      | NAD83       | North America | ±3m      | USA, Canada, Mexico |
| 4277      | OSGB 1936   | Great Britain | ±2m      | UK surveys          |
| 4275      | NTF (Paris) | France        | ±2m      | French legacy       |
| 4202      | AGD66       | Australia     | ±5m      | Australian data     |
| 4291      | SAD69       | South America | ±5m      | Brazilian data      |
| 4267      | NAD27       | North America | ±10m     | Legacy US data      |

### Projected CRS - UTM (Universal Transverse Mercator)

UTM divides world into 60 zones (6° wide), each with own projection.

**Zone Numbering**:

- Zone 1: 180°W to 174°W
- Zone 30: 6°W to 0°
- Zone 31: 0° to 6°E
- Zone 60: 174°E to 180°E

**Common UTM Codes**:

| Zone | North EPSG | South EPSG |
| ---- | ---------- | ---------- |
| 1    | 32601      | 32701      |
| 10   | 32610      | 32710      |
| 33   | 32633      | 32733      |
| 60   | 32660      | 32760      |

**Example**:

- `EPSG:32633`: UTM Zone 33N (6°E to 12°E, Northern Hemisphere)
- `EPSG:32733`: UTM Zone 33S (6°E to 12°E, Southern Hemisphere)

### Other Common Projected CRS

| EPSG Code | Name                | Region  | Use                        |
| --------- | ------------------- | ------- | -------------------------- |
| 3857      | Web Mercator        | Global  | Web mapping (Google, OSM)  |
| 2154      | Lambert 93          | France  | French official projection |
| 3301      | Estonia 1992        | Estonia | Estonian official          |
| 3857      | ETRS89 Web Mercator | Europe  | European web services      |
| 2154      | Mercator 1SP        | Global  | Historical web             |

### Find More CRS

Visit [EPSG.io](https://epsg.io/) to search:

1. Go to website
2. Search by:
   - EPSG code (e.g., "4326")
   - Name (e.g., "NAD83")
   - Area (e.g., "United States")
3. Get WKT definition and conversion formulas

---

## Working with CRS

### Check Project CRS

1. **View → Map Properties**
2. Find "Coordinate Reference System" section
3. Shows current CRS name and EPSG code
4. Shows bounds in current CRS units

### Check Layer CRS

1. **Right-click layer → Properties**
2. Go to "Source" tab
3. Find "CRS" field
4. Shows layer CRS (may differ from project CRS)

### Set or Change CRS

**For Project**:

1. View → Map Properties
2. Click "Change CRS" button
3. Dialog shows available CRS:
   - Recently used (top)
   - Favorites (with star)
   - By region
   - Search box
4. Select desired CRS
5. Click OK
6. Map redraws in new CRS

**For Layer**:

1. Right-click layer → Set CRS
2. Select CRS from dialog
3. Layer updates display
4. Project CRS unchanged

### Add CRS to Favorites

1. View → Map Properties (or layer properties)
2. Find desired CRS
3. Click star icon (or right-click → Add to Favorites)
4. CRS appears in Favorites section next time

### Create Custom CRS

**Advanced users** can define custom CRS:

1. Edit → Preferences → CRS
2. Click "New CRS"
3. Enter WKT definition:
   ```
   PROJCS["Custom Projection",
     GEOGCS["WGS 84",...],
     PROJECTION["Transverse_Mercator"],
     PARAMETER["false_easting",500000],
     PARAMETER["false_northing",0],
     PARAMETER["scale_factor",0.9996],
     PARAMETER["central_meridian",3],
     PARAMETER["latitude_of_origin",0],
     UNIT["metre",1]]
   ```
4. Click "Test" to verify
5. Click "Save"

Or paste from EPSG.io WKT definition.

---

## CRS Transformation

### Understanding Transformations

When project CRS differs from layer CRS, application automatically transforms coordinates.

**Transformation Chain**:

```
Layer CRS (Source) → WGS 84 (Pivot) → Project CRS (Target)
```

**Accuracy**: Generally within 1-2 meters for well-defined transformations

### Transform Data

**Save Layer in Different CRS**:

1. Right-click layer → Export → Export As
2. Choose output format
3. In "CRS" dropdown, select target CRS
4. Click Export
5. New file created in target CRS

**Example**:

```bash
# Command line equivalent
ogr2ogr -t_srs EPSG:32633 output.shp input.shp
```

### Transformation Methods

Some transformations have multiple methods. Select method based on accuracy needs:

**In Export Dialog**:

1. Click "Transformation" dropdown (if available)
2. Options:
   - Default: System default method
   - Accuracy 1: Highest accuracy, may be slower
   - Accuracy 2: Good accuracy, faster
   - Fast: Rapid transformation, lower accuracy
3. Select appropriate level

### Handle Transformation Warnings

**Warning**: "Multiple transformations available for CRS pair"

**Causes**:

- Different transformation methods have different accuracy
- Different transformation paths possible
- Different datum shifts available

**Solution**:

1. Choose transformation method
2. Or disable warning in Preferences

**Example for NAD27 to WGS 84**:

- Direct method: ~500 meter accuracy
- Via NAD83: ~50 meter accuracy
- Use grid file (if available): ~1 meter accuracy

---

## Accuracy and Precision

### Coordinate Precision

**How many decimal places are needed?**

For WGS 84 (geographic):

- 2 decimals: ±1.1 km (city block)
- 3 decimals: ±111 m (street address)
- 4 decimals: ±11 m (building)
- 5 decimals: ±1.1 m (tree on property)
- 6 decimals: ±0.11 m (11 cm)
- 7 decimals: ±1.1 cm (surveying)
- 8+ decimals: ±mm (unnecessary for most uses)

For projected coordinates (UTM, meters):

- 0 decimals: 1 m
- 1 decimal: 0.1 m (10 cm)
- 2 decimals: 1 cm
- 3 decimals: 1 mm

**Best Practice**: Use 6 decimals for WGS 84, 2 decimals for projected.

### Accuracy vs Precision

**Precision**: How many decimal places (what you specify)

- May not reflect actual accuracy
- Precision doesn't guarantee accuracy

**Accuracy**: How close to true location

- Depends on:
  - Source data quality
  - Survey method
  - CRS accuracy
  - Transformation method

**Example**:

- Coordinate: `40.712776, -74.006058` (6 decimals = precise to ~11cm)
- But source was GPS with ±5m accuracy (less precise than shown)
- Result: Appears precise but is only accurate to 5m

### CRS Accuracy

Each CRS has inherent accuracy limitations:

| CRS              | Horizontal Accuracy | Best For            |
| ---------------- | ------------------- | ------------------- |
| WGS 84           | ±5 m                | Global data         |
| NAD83            | ±3 m                | North American      |
| UTM              | ±1 m                | Regional surveying  |
| National systems | ±0.5 m              | Local precise work  |
| RTK GPS          | ±0.05 m             | Engineering surveys |

---

## Common CRS by Region

### North America

**Canada**

- National: NAD83 (EPSG:4269)
- For measurements: UTM Zone (varies by location)
- Example: UTM Zone 11N (EPSG:32611) for British Columbia

**United States**

- National: NAD83 (EPSG:4269)
- For measurements: State Plane Coordinate System or UTM
- Example: NAD83 / UTM Zone 10N (EPSG:32610) for California

**Mexico**

- National: NAD83 (EPSG:4269)
- Projected: Mexican Transverse Mercator

### Europe

**Great Britain/UK**

- National: OSGB 1936 (EPSG:4277)
- Projected: British National Grid (EPSG:27700)

**France**

- National: Lambert 93 (EPSG:2154)
- Legacy: NTF Paris (EPSG:4275)

**Germany**

- National: ETRS89 (EPSG:4258)
- Projected: Gauss-Krüger zones

**Scandinavia**

- Sweden: SWEREF 99 (EPSG:3006)
- Norway: UTM Zone 33N (EPSG:32633)
- Finland: ETRS-GK25 (EPSG:3877)

### Asia-Pacific

**Australia**

- National: GDA94 (EPSG:4283)
- Projected: Australian Map Grid zones

**New Zealand**

- National: NZGD2000 (EPSG:4167)
- Projected: NZGD2000 / New Zealand Transverse Mercator

**China**

- National: CGC2000 (EPSG:4491)
- Projected: Gauss-Krüger projection

**Japan**

- National: Japan Geodetic Datum 2000 (EPSG:4612)
- Projected: Japan UTM zones

### South America

**Brazil**

- National: SIRGAS 2000 (EPSG:4674)
- Projected: Albers Equal Area or UTM

**Argentina**

- National: POSGAR 2007 (EPSG:5350)
- Projected: Argentine UTM zones

### Africa

**South Africa**

- National: Hartebeesthoek94 (EPSG:4148)
- Projected: SA93 Albers

**Most African Countries**

- International: WGS 84 (EPSG:4326)
- Legacy: Various colonial era CRS

### Web Services

**Global Web Services**

- Google Maps, Bing, Leaflet, OpenStreetMap: Web Mercator (EPSG:3857)
- Also accept: WGS 84 (EPSG:4326)

---

## CRS in Data Warehouses

### DuckDB with GIS Data

**WGS 84 Default**:

```sql
-- Coordinate in WGS 84
SELECT ST_Point(-74.0060, 40.7128) as geometry;  -- NYC
```

**Specify CRS**:

```sql
-- DuckDB stores CRS as SRID
SELECT ST_SetSRID(ST_Point(-74.0060, 40.7128), 4326);
```

**Transform CRS**:

```sql
-- Transform to UTM Zone 18N
SELECT ST_Transform(geometry, 4326, 32618) FROM table;
```

### Snowflake Geometry

**Native Support for WGS 84**:

```sql
SELECT ST_POINT(-74.0060, 40.7128)::GEOGRAPHY;
```

**Different CRS**:

```sql
-- Snowflake GEOGRAPHY assumes WGS 84
-- For other CRS, use GEOMETRY type
SELECT ST_POINT(-74.0060, 40.7128)::GEOMETRY(4326);
```

### Databricks Mosaic

**Get CRS Info**:

```python
from databricks.labs.mosaic import *

df = spark.read.parquet("path/to/geospatial/data")
# Mosaic auto-detects CRS
display(df.select(mos.st_srid(mos.col("geometry"))))
```

**Transform CRS**:

```sql
SELECT mosaic_transform_to(geometry, "EPSG:32633")
FROM my_geospatial_table;
```

### Apache Iceberg

**Store CRS Metadata**:

```python
# Iceberg can store CRS as table property
table = catalog.load_table("geometry_table")
table.update_properties({
    "geospatial.crs": "EPSG:4326",
    "geospatial.geometry_column": "geometry"
})
```

---

## Troubleshooting CRS Issues

### Data Appears at Wrong Location

**Causes**:

1. Layer CRS incorrectly set
2. Data actually is in different CRS
3. Transformation not working

**Solutions**:

1. Check layer CRS: Right-click → Properties → Source
2. Try setting different CRS
3. Verify data values are reasonable for stated CRS
4. Check if CRS needs specific transformation

### Coordinate Values Look Wrong

**Example**: Latitude 74.0060 (too large for WGS 84)

**Likely Causes**:

- CRS set incorrectly
- Data is in different CRS than expected
- Coordinates are in different order (lon/lat vs lat/lon)

**Solutions**:

1. Check data documentation for CRS
2. Verify coordinate ranges match CRS
3. Swap coordinates if in wrong order (see [USAGE.md](USAGE.md))

### Distances/Areas Calculate Wrong

**Causes**:

1. Using WGS 84 (degrees) for measurement (inherent to projection)
2. Using non-conformal projection for linear measurements
3. Coordinate system not set

**Solutions**:

1. Use projected CRS (like UTM) for accurate measurements
2. Choose appropriate projection:
   - Conformal: For measuring angles/bearings
   - Equal area: For measuring areas
   - Equidistant: For measuring distances
3. Verify CRS is set correctly

### Transformation Takes Too Long

**Causes**:

1. Complex transformation
2. Grid file interpolation
3. Large number of features

**Solutions**:

1. Use simpler transformation (less accuracy)
2. Set transformation to "Fast" in export dialog
3. Process smaller subset

---

## Additional Resources

### Online References

- [EPSG Registry](https://epsg.io/) - Search CRS definitions
- [Proj.org](https://proj.org/) - Projection library documentation
- [GDAL CRS Handling](https://gdal.org/en/latest/) - GDAL documentation
- [OGC CRS](https://www.ogc.org/standards/gml) - OGC standards

### Key Concepts

- **Datum**: Foundation surface (WGS 84, NAD83, etc.)
- **Ellipsoid**: Mathematical Earth shape
- **Projection**: Method to flatten Earth
- **SRID**: Spatial Reference ID (same as EPSG code)
- **WKT**: Well-Known Text format for CRS definition
- **Transformation**: Converting coordinates between CRS

---

**Last Updated**: February 2026  
**Documentation Version**: 1.0.0

For more information on working with coordinates, see [USAGE.md](USAGE.md) and [CONFIGURATION.md](CONFIGURATION.md).
