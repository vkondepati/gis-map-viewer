# Troubleshooting Guide

Common issues and solutions for the Desktop GIS Map Viewer.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Data Loading Problems](#data-loading-problems)
3. [Performance Issues](#performance-issues)
4. [Rendering and Visualization](#rendering-and-visualization)
5. [Feature Editing](#feature-editing)
6. [Data Warehouse Connection](#data-warehouse-connection)
7. [Web Services](#web-services)
8. [Export and File Operations](#export-and-file-operations)
9. [Coordinate System Issues](#coordinate-system-issues)
10. [Debug Mode and Logging](#debug-mode-and-logging)

---

## Installation Issues

### Application Won't Start

**Symptoms**: Crash immediately after launch or nothing happens.

**Solutions**:

1. **Clear Application Cache**

   ```bash
   # Windows
   rmdir %APPDATA%\GISMapViewer /s /q

   # macOS
   rm -rf ~/Library/Application\ Support/GISMapViewer

   # Linux
   rm -rf ~/.config/GISMapViewer
   ```

2. **Reinstall Application**
   - Uninstall completely
   - Restart system
   - Reinstall from official source

3. **Check System Requirements**
   - Verify OS version (see [INSTALLATION.md](INSTALLATION.md))
   - Check available RAM (minimum 4 GB)
   - Verify graphics driver is up to date

4. **Enable Debug Mode**
   - Set environment variable: `GIS_DEBUG=1`
   - Check log file for errors (see [Debug Mode](#debug-mode-and-logging))

### Missing Dependencies

**Symptoms**: Error message about missing libraries or components.

**Solutions**:

1. **Repair Installation**
   - Windows: Use Add/Remove Programs → Repair
   - macOS: Reinstall using DMG
   - Linux: Reinstall package

2. **Install Required Components**

   ```bash
   # Windows: Visual C++ Redistributable
   # Download from: https://support.microsoft.com/en-us/help/2977003

   # macOS: Xcode Command Line Tools
   xcode-select --install

   # Linux: Required packages
   sudo apt-get install libgdal26 libgeos-3.8.0  # Ubuntu/Debian
   sudo dnf install gdal geos  # Fedora/RHEL
   ```

3. **Update GDAL and GEOS**

   ```bash
   # Check current versions
   ogrinfo --version
   python -c "import osgeo.osr; print(osgeo.__version__)"

   # Update via package manager
   pip install --upgrade gdal
   ```

### Slow Installation

**Symptoms**: Installation takes longer than expected.

**Solutions**:

1. **Check System Resources**
   - Close unnecessary applications
   - Verify available disk space (at least 1 GB)
   - Check internet connection speed

2. **Use Offline Installation**
   - Download offline installer from website
   - Run locally without network

3. **Clear Temporary Files**

   ```bash
   # Windows
   cleanmgr

   # macOS
   rm -rf ~/Library/Caches/pip

   # Linux
   sudo apt-get clean
   ```

---

## Data Loading Problems

### File Not Opening

**Symptoms**: Selected file doesn't load or error message appears.

**Causes & Solutions**:

1. **Unsupported Format**
   - Check [SUPPORTED_FORMATS.md](SUPPORTED_FORMATS.md)
   - Convert file to supported format using GDAL:

     ```bash
     # Convert Shapefile to GeoJSON
     ogr2ogr -f GeoJSON output.geojson input.shp

     # Convert GeoTIFF to PNG
     gdal_translate input.tif output.png
     ```

2. **Corrupted File**
   - Try opening with GDAL command line:
     ```bash
     ogrinfo filename.shp  # For vector files
     gdalinfo filename.tif  # For raster files
     ```
   - If errors appear, file is corrupted
   - Use GDAL to repair if possible:
     ```bash
     ogr2ogr -f Shapefile -explodecollections output.shp input.shp
     ```

3. **File Permissions**
   - Check file is readable:
     ```bash
     # Windows: Right-click → Properties → Security
     # Linux/macOS: chmod +r filename
     ```

4. **File Encoding Issues**
   - CSV/GeoJSON encoding problems
   - Re-save with UTF-8 encoding:
     ```bash
     # Using Python
     python -c "
     import pandas as pd
     df = pd.read_csv('file.csv', encoding='latin-1')
     df.to_csv('file_utf8.csv', encoding='utf-8', index=False)
     "
     ```

### Large Files Loading Slowly

**Symptoms**: File takes minutes to load, or application becomes unresponsive.

**Solutions**:

1. **Simplify Geometry**
   - Reduce vertex count:

     ```bash
     # Using GDAL
     ogr2ogr -f Shapefile -simplify 10 output.shp input.shp

     # Using Python
     import geopandas as gpd
     gdf = gpd.read_file('input.shp')
     gdf['geometry'] = gdf.geometry.simplify(tolerance=0.01)
     gdf.to_file('output.shp')
     ```

2. **Create Spatial Index**
   - For Shapefile:
     ```bash
     ogrinfo -sql "CREATE SPATIAL INDEX ON geometry" input.shp
     ```

3. **Use Tiles Instead**
   - For raster data, use XYZ tiles
   - Split large files into smaller sections
   - Load only visible extent

4. **Increase Memory Limit**
   - Set environment variable:

     ```bash
     # Windows (PowerShell)
     $env:NODE_MAX_HEAP=4096

     # Linux/macOS
     export NODE_MAX_HEAP=4096
     ```

### Missing Data Values or Attributes

**Symptoms**: Features load but have incomplete attributes or missing geometries.

**Solutions**:

1. **Check Attribute Table**
   - Open attribute table and look for empty cells
   - Use GDAL to inspect:
     ```bash
     ogrinfo input.shp -summary
     ```

2. **Repair Null Geometries**

   ```bash
   # Remove features with missing geometry
   ogr2ogr -f Shapefile -where "geometry IS NOT NULL" output.shp input.shp
   ```

3. **Handle Missing Values**
   - In application: Enable "Show NULL" in View menu
   - In Python before import:
     ```python
     gdf = gdf.dropna(subset=['geometry'])
     ```

---

## Performance Issues

### Application Runs Slowly

**Symptoms**: Pan/zoom sluggish, rendering takes time, interface freezes.

**Solutions**:

1. **Reduce Layer Count**
   - Keep only necessary layers visible
   - Hide or remove background layers
   - Check View → Performance menu

2. **Optimize Raster Display**
   - Reduce raster resolution:
     ```bash
     gdalwarp -tr 10 10 input.tif output.tif  # Set 10x10 resolution
     ```
   - Use compression:
     ```bash
     gdalwarp -co COMPRESS=DEFLATE input.tif output.tif
     ```

3. **Disable Styling Effects**
   - View → Display Options
   - Disable shadows, edge effects
   - Use simpler symbology

4. **Close Unused Dialogs**
   - Attribute tables consume memory
   - Use docks instead of floating windows
   - Close analysis results when done

5. **Increase System Resources**
   - Close other applications
   - Check RAM usage (should be under 80%)
   - Free disk space (at least 1 GB)

6. **Check for Memory Leaks**
   - Monitor Task Manager (Windows) or Activity Monitor (macOS)
   - Memory should not continuously increase
   - Restart application if memory stays high

### Zoom/Pan Not Responsive

**Symptoms**: Delay between mouse action and map response.

**Solutions**:

1. **Check Graphics Performance**
   - View → Display Settings
   - Enable Hardware Acceleration (if available)
   - Reduce viewport resolution

2. **Simplify Layer Style**
   - Remove data-driven styling
   - Use solid colors instead of patterns
   - Reduce label density

3. **Update Graphics Drivers**
   - Windows: Device Manager → Update Driver
   - macOS: Software Update
   - Linux: `sudo apt-get install --only-upgrade xserver-xorg-video-*`

---

## Rendering and Visualization

### Map Looks Distorted

**Symptoms**: Features appear stretched, wrong shape, or misaligned.

**Causes & Solutions**:

1. **Wrong Coordinate System**
   - Check project CRS: View → Map Properties
   - Compare with data CRS
   - See [CRS_SUPPORT.md](CRS_SUPPORT.md)
   - Reproject if needed:
     ```bash
     ogr2ogr -t_srs EPSG:4326 output.shp input.shp
     ```

2. **Projection Issue**
   - Some projections distort at map edges
   - Try different projection for viewing
   - Use WGS 84 for consistent reference

3. **Incorrect Bounds**
   - Reset map extent: View → Reset Map
   - Or manually set bounds in properties

### Colors Not Displaying Correctly

**Symptoms**: Layer appears black, wrong colors, or no colors applied.

**Solutions**:

1. **Check Symbology**
   - Right-click layer → Symbology
   - Verify color scheme is applied
   - Preview colors in style panel

2. **Verify Data Classification**
   - If using classified style, check value ranges
   - Ensure data has expected value distribution
   - Use Styling → Histogram to inspect

3. **Adjust Transparency/Opacity**
   - Right-click layer → Properties
   - Increase Opacity slider if invisible
   - Reduce if too opaque (blocking other layers)

4. **Check Display Mode**
   - Verify layer mode (normal, multiply, screen, etc.)
   - Try different blend modes

### Labels Not Showing

**Symptoms**: Layer labels disabled or invisible.

**Solutions**:

1. **Enable Labels**
   - Right-click layer → Labeling → Enable
   - Or use View → Layers → Label Settings

2. **Adjust Label Settings**
   - Check min zoom level for labels
   - Increase label size if too small
   - Verify text color contrasts with background

3. **Check Conflicting Layers**
   - Labels hidden behind opaque layers
   - Reorder layers to bring labeled layer on top
   - Reduce opacity of overlaying layers

4. **Optimize Label Placement**
   - View → Labeling Options
   - Adjust conflict resolution method
   - Use simplified geometry for placement

---

## Feature Editing

### Can't Edit Features

**Symptoms**: Edit buttons disabled or features locked.

**Solutions**:

1. **Enable Edit Mode**
   - Edit → Edit Mode (or press E)
   - Layer must support editing (not read-only)
   - Check layer format supports editing (see [EDITING.md](EDITING.md))

2. **Check Layer Permissions**
   - Verify file/database write permissions
   - For web services, check credentials
   - Database layers need UPDATE privilege

3. **Feature Type Not Editable**
   - Some formats have limitations
   - GeoPackage and Shapefile: All types OK
   - GeoJSON: Full support
   - Web services: Check server capability

### Changes Not Saving

**Symptoms**: Edits appear in session but don't persist.

**Solutions**:

1. **Save Project**
   - File → Save (Ctrl+S)
   - For file-based data, saves to original file
   - For database data, saves immediately on edit

2. **Check File Permissions**
   - Verify file is not read-only
   - Check directory has write permissions
   - Ensure sufficient disk space

3. **Backup Creation**
   - Verify backup file created (.bak)
   - Check backup directory

4. **Database Connection**
   - Verify database connection still active
   - For remote databases, check network
   - Verify credentials still valid

5. **Undo Changes**
   - If save fails, undo recent edits
   - File → Revert to Last Saved
   - Start again with valid data

### Geometry Validation Errors

**Symptoms**: Error message when saving edits about invalid geometry.

**Solutions**:

1. **Check Self-Intersections**
   - For polygons, ensure no self-crossing boundaries
   - Edit → Validate Geometry
   - Use Edit → Repair Geometry to fix

2. **Verify Coordinate Precision**
   - Check coordinates are within valid range
   - For WGS 84: Lat [-90, 90], Lon [-180, 180]
   - See [CRS_SUPPORT.md](CRS_SUPPORT.md)

3. **Check Ring Orientation**
   - Polygon exterior rings must be clockwise
   - Interior rings (holes) must be counter-clockwise
   - Use Edit → Fix Ring Orientation

4. **Simplify Complex Geometry**
   - Too many vertices can cause issues
   - Edit → Simplify Geometry
   - Use appropriate tolerance

---

## Data Warehouse Connection

### Can't Connect to Data Warehouse

**Symptoms**: Connection fails, timeout, or authentication error.

**Solutions**:

**DuckDB**

1. **File Not Found**
   - Verify file path exists
   - Use absolute path: `/full/path/to/file.duckdb`
   - Check file permissions

2. **Already In Use**
   - Only one connection per file
   - Close other instances

**Snowflake**

1. **Authentication Failed**
   - Verify username and password
   - Check account identifier (without .us-east-1.snowflakecomputing.com)
   - Verify warehouse exists and is running

   ```bash
   # Test connection via command line
   snowsql -a accountname -u username -w warehouse_name
   ```

2. **Network Issues**
   - Verify internet connection
   - Check firewall rules allow Snowflake
   - Verify IP not blocked by Snowflake network policy

3. **Warehouse Not Active**
   - Start warehouse from Snowflake web UI
   - Or set AUTO_SUSPEND to longer interval

**Databricks**

1. **Invalid Token**
   - Generate new PAT in Databricks workspace
   - Verify token has correct permissions
   - Token expiration date not passed

   ```bash
   # Generate new token in Databricks UI:
   # Settings → User Settings → Access Tokens
   ```

2. **Cluster Not Running**
   - Start cluster before connecting
   - Or set auto-start in connection options
   - Verify cluster has Mosaic library

3. **Catalog/Schema Not Found**
   - Verify catalog/schema names exact case
   - Check permissions on schema

**Apache Iceberg**

1. **Catalog Not Reachable**
   - For REST catalog: verify URL is accessible
   - For S3: verify bucket and credentials
   - For JDBC: verify database connection

2. **Table Not Found**
   - Verify table name and schema
   - Check schema is specified correctly
   - List available tables:
     ```python
     # In Python
     from iceberg.catalog import load_catalog
     catalog = load_catalog(...)
     tables = catalog.list_namespaces()
     ```

### Slow Data Warehouse Queries

**Symptoms**: Loading data from warehouse takes long time.

**Solutions**:

1. **Optimize Query**
   - Add WHERE clause to filter data
   - Use spatial index if available
   - Select only needed columns

2. **Check Network**
   - Verify bandwidth to data warehouse
   - Try during off-peak hours
   - Check latency: `ping warehouse_host`

3. **Database Performance**
   - Check warehouse/cluster performance
   - Scale up if needed
   - Run ANALYZE for statistics:
     ```sql
     ANALYZE TABLE table_name COMPUTE STATISTICS;
     ```

4. **Local Cache**
   - For repeated queries, cache result locally
   - Save to local GeoPackage for faster access

---

## Web Services

### WMS Layer Not Loading

**Symptoms**: Web map service layer appears blank or shows error.

**Solutions**:

1. **Verify URL Format**
   - Check URL is correct (typically ends with `?service=WMS`)
   - Format: `http://server.com/wms?service=WMS&version=1.3.0&...`
   - Use GetCapabilities to verify:
     ```
     http://server.com/wms?service=WMS&version=1.3.0&request=GetCapabilities
     ```

2. **Check Layer Name**
   - Open GetCapabilities document
   - Find Layer name in XML
   - Verify exact spelling and case

3. **Network Connectivity**
   - Ping server to verify it's reachable
   - Check firewall allows WMS port (usually 80/443)
   - Try in browser first: paste URL in browser

4. **Coordinate System Mismatch**
   - Check WMS supported CRS in GetCapabilities
   - Verify map CRS matches WMS layer CRS
   - Try EPSG:4326 or EPSG:3857

5. **Server Issues**
   - WMS server may be down
   - Try different WMS server
   - Check server logs if you have access

### WFS Feature Service Not Working

**Symptoms**: Can't download features from web feature service.

**Solutions**:

1. **Verify WFS URL**
   - Format: `http://server.com/wfs?service=WFS&version=2.0.0&...`
   - Get capabilities: `http://server.com/wfs?service=WFS&request=GetCapabilities`

2. **Check Feature Type Name**
   - List available features in GetCapabilities
   - Use exact name as shown in XML

3. **Adjust Query Limits**
   - WFS may have pagination limit
   - Specify STARTINDEX and COUNT parameters
   - Or use spatial filter to get subset

4. **Handle Authentication**
   - Some WFS services require authentication
   - Check connection properties for username/password
   - Some services use API key in URL parameter

### WMTS Tiles Not Displaying

**Symptoms**: Tile layer appears blank or loads very slowly.

**Solutions**:

1. **Verify Tile URL**
   - Format: `http://server.com/wmts/.../{z}/{x}/{y}.png`
   - Check {z}/{x}/{y} placeholders correct
   - Verify tile extent matches expected area

2. **Check Zoom Levels**
   - Verify min/max zoom settings
   - Some WMTS services only have certain zoom levels
   - Adjust zoom range in layer properties

3. **Tile Coordinate System**
   - Verify WMTS uses standard Web Mercator (EPSG:3857)
   - Or matches your map CRS
   - Try with EPSG:4326 if default fails

---

## Export and File Operations

### Export Fails or Incomplete

**Symptoms**: Export dialog closes without creating file, or file is empty/corrupted.

**Solutions**:

1. **Check Output Path**
   - Verify output directory exists
   - Check directory has write permissions
   - Use absolute path instead of relative

2. **Verify Data Selection**
   - Ensure features/layers are selected
   - Check visible/selected toggles correct
   - Try exporting smaller subset first

3. **Output Format Support**
   - Verify format supports your data type
   - Some formats don't support certain geometry types
   - See [SUPPORTED_FORMATS.md](SUPPORTED_FORMATS.md)

4. **Check Disk Space**
   - Ensure sufficient space for export
   - Larger files need more space
   - Free up space and retry

5. **Export with GDAL**
   - Use command line as alternative:
     ```bash
     ogr2ogr -f "GeoJSON" output.geojson input.shp
     ```

### File Size Too Large

**Symptoms**: Exported file much larger than expected.

**Solutions**:

1. **Simplify Geometry**
   - Use Edit → Simplify Geometry before export
   - Reduces vertex count

2. **Use Compression**
   - Save as GeoPackage with compression
   - Or use GDAL: `gdalwarp -co COMPRESS=DEFLATE`

3. **Select Subset**
   - Export only needed features
   - Use spatial/attribute filter

4. **Change Format**
   - GeoPackage smaller than Shapefile
   - Compressed GeoJSON smaller than raw JSON

---

## Coordinate System Issues

### Map Shows at Wrong Location

**Symptoms**: Features appear at wrong coordinates on map.

**Solutions**:

1. **Check Project CRS**
   - View → Map Properties
   - Verify CRS matches your data
   - For geographic data, should be EPSG:4326

2. **Set Layer CRS**
   - Right-click layer → Properties
   - Check "Source CRS" matches actual data
   - If wrong, use "Set CRS" option

3. **Transform CRS if Needed**
   - Layer displays at wrong location even with correct CRS
   - Use Edit → Transform CRS
   - Select target CRS (usually EPSG:4326)

4. **Verify Data Values**
   - Check coordinates are in valid range
   - WGS 84 Lat: [-90, 90], Lon: [-180, 180]
   - Use attribute table to inspect coordinate values

5. **Reproject Layer**
   ```bash
   ogr2ogr -t_srs EPSG:4326 output.shp input.shp
   ```

See [CRS_SUPPORT.md](CRS_SUPPORT.md) for complete coordinate system information.

### Accuracy Issues After Projection

**Symptoms**: Measured distances incorrect, coordinates slightly off.

**Solutions**:

1. **Choose Appropriate Projection**
   - Mercator suitable for worldwide viewing
   - UTM better for precise measurements
   - For measurements in degrees, use geographic (EPSG:4326)

2. **Check Precision Setting**
   - View → Display Precision
   - Increase decimal places if needed
   - Check coordinate display format

3. **Verify Transformation**
   - Different transformation methods have different accuracy
   - Use standard transformations for known datasets
   - Test accuracy with known control points

---

## Debug Mode and Logging

### Enable Debug Mode

To get detailed diagnostic information:

1. **Set Environment Variable**

   ```bash
   # Windows (PowerShell)
   $env:GIS_DEBUG=1

   # Windows (Command Prompt)
   set GIS_DEBUG=1

   # macOS/Linux
   export GIS_DEBUG=1
   ```

2. **Start Application**
   - Launch normally
   - Additional diagnostic output in console
   - Log files created with detailed information

### Check Log Files

**Windows**

```
%APPDATA%\GISMapViewer\logs\app.log
%APPDATA%\GISMapViewer\logs\error.log
```

**macOS**

```
~/Library/Application Support/GISMapViewer/logs/app.log
~/Library/Application Support/GISMapViewer/logs/error.log
```

**Linux**

```
~/.config/GISMapViewer/logs/app.log
~/.config/GISMapViewer/logs/error.log
```

### Enable Verbose Logging

```bash
# Windows
set GIS_LOG_LEVEL=debug

# macOS/Linux
export GIS_LOG_LEVEL=debug
```

### Common Log Error Messages

| Error                                     | Meaning                    | Solution                    |
| ----------------------------------------- | -------------------------- | --------------------------- |
| `GDAL_ERROR: -1: Unsupported file format` | File format not recognized | Convert to supported format |
| `GEOS_ERROR: topology exception`          | Invalid geometry           | Use Edit → Repair Geometry  |
| `CRS_ERROR: Unknown EPSG code`            | CRS not recognized         | Verify EPSG code is valid   |
| `LOAD_ERROR: Out of memory`               | Insufficient RAM for file  | Simplify or split file      |
| `CONNECT_ERROR: Connection refused`       | Can't reach remote server  | Check network and server    |

---

## Getting Additional Help

If troubleshooting doesn't resolve your issue:

1. **Check Documentation**
   - [USAGE.md](USAGE.md) - How to use features
   - [INSTALLATION.md](INSTALLATION.md) - Setup issues
   - [SUPPORTED_FORMATS.md](SUPPORTED_FORMATS.md) - Data format issues
   - [DATA_WAREHOUSES.md](DATA_WAREHOUSES.md) - Data warehouse connection

2. **Enable Debug Mode** (see above)
   - Provide error message and log file excerpt
   - Include system information

3. **Report Issue**
   - Go to [GitHub Issues](https://github.com/yourusername/gis-map-viewer/issues)
   - Provide:
     - Clear problem description
     - Steps to reproduce
     - Screenshot if applicable
     - System information (OS, version, RAM)
     - Error message and log excerpt

4. **Ask for Help**
   - [GitHub Discussions](https://github.com/yourusername/gis-map-viewer/discussions)
   - Discord community (if available)

---

**Last Updated**: February 2026  
**Documentation Version**: 1.0.0
