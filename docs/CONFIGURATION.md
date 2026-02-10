# Configuration Guide

User preferences, settings, and customization options for Desktop GIS Map Viewer.

## Table of Contents

1. [User Preferences](#user-preferences)
2. [Display Settings](#display-settings)
3. [Performance Configuration](#performance-configuration)
4. [Data Source Configuration](#data-source-configuration)
5. [Project Settings](#project-settings)
6. [Advanced Settings](#advanced-settings)
7. [Configuration Files](#configuration-files)
8. [Preferences Storage](#preferences-storage)

---

## User Preferences

Access user preferences through **Edit → Preferences** (or **GIS Map Viewer → Preferences** on macOS).

### General Settings

**Language**

- Available languages: English, Spanish, French, German, Chinese (Simplified), Japanese
- Default: English
- Restart application for changes to take effect

**Theme**

- Light: Light interface with dark text
- Dark: Dark interface with light text
- Auto: Follow system theme
- Default: Light

**Unit System**

- Metric: Kilometers, meters, square meters
- Imperial: Miles, feet, square feet
- Nautical: Nautical miles
- Default: Metric

**Number Format**

- Decimal separator: Period (.) or Comma (,)
- Thousands separator: Comma (,) or Period (.)
- Significant digits: 2-8
- Default: Period separator, comma thousands

**Date/Time Format**

- Date: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- Time: 12-hour or 24-hour
- Timezone: Auto-detect or select manually
- Default: System locale

### Startup Behavior

**On Launch**

- Empty: Start with blank map
- Last Project: Restore last open project
- Specific Project: Always open selected project
- Default: Empty

**Recent Projects**

- Number to display: 5-20
- Auto-load: Yes/No
- Default: 10 recent projects, no auto-load

**Check for Updates**

- Never
- On startup
- Weekly
- Monthly
- Default: Weekly

---

## Display Settings

Configure map visualization and interface appearance.

### View Options

**Edit → Display Options** or **View → Display Settings**

**Map Background**

- Color: Any RGB color (click to customize)
- Image: Select background image file
- Pattern: Choose predefined pattern
- Default: Light gray (#E8E8E8)

**Zoom Controls**

- Show zoom buttons: Yes/No
- Show zoom slider: Yes/No
- Show scale bar: Yes/No
- Show coordinates: Yes/No
- Default: All enabled

**Navigation Controls**

- Show compass: Yes/No
- Show north arrow: Yes/No
- Show zoom extent box: Yes/No
- Default: All enabled

**Attribution**

- Show attribution text: Yes/No
- Position: Bottom-left, bottom-right, top-left, top-right
- Font size: 8-14 points
- Default: Enabled, bottom-right

### Layer Display

**Right-click Layer → Display Properties**

**Layer Opacity/Transparency**

- Range: 0% (invisible) to 100% (opaque)
- Default: 100%
- Can be set per layer

**Blend Mode**

- Normal: Standard blending
- Multiply: Darken effect
- Screen: Lighten effect
- Overlay: Combined multiply/screen
- Color dodge: Bright effect
- Color burn: Dark effect
- Lighten: Keep lighter colors
- Darken: Keep darker colors
- Default: Normal

**Visibility Range**

- Min Zoom: Layer invisible below this zoom level
- Max Zoom: Layer invisible above this zoom level
- Useful for decluttering at different scales
- Default: No limits

### Symbology

**Right-click Layer → Symbology**

**Line Style**

- Solid, Dashed, Dotted, Dash-dot
- Width: 0.5-10 pixels
- Color: Any RGB color
- Opacity: 0-100%

**Fill Style**

- Solid, Pattern, Gradient
- Color: Any RGB color
- Opacity: 0-100%
- Hatch pattern: None, cross-hatch, diagonal, etc.

**Point Style**

- Circle, Square, Triangle, Diamond, Star
- Size: 2-50 pixels
- Color: Any RGB color
- Outline: Yes/No, customizable

**Label Style**

- Font: System fonts (Arial, Times, Courier, etc.)
- Size: 6-72 points
- Color: Any RGB color
- Bold, Italic, Underline options
- Halo: Colored outline for readability

### Color Schemes

**Data Classification Colors**

- Single color: One color for all features
- Unique values: Different color per value
- Graduated: Color gradient by value range
- Categorized: Predefined color categories
- Default: Unique colors

**Built-in Palettes**

- Viridis: Perceptually uniform
- Plasma: High contrast
- Cool: Blue to cyan
- Warm: Yellow to red
- RdYlBu: Red-Yellow-Blue (diverging)
- Custom: Create custom palette

---

## Performance Configuration

Optimize application performance for your system.

### Rendering Options

**View → Display Settings → Performance**

**Hardware Acceleration**

- Enabled: Use GPU for rendering (faster)
- Disabled: Use CPU only (compatibility)
- Default: Enabled (if GPU available)

**Tile Cache Size**

- Small (100 MB): Limited cache, uses less RAM
- Medium (500 MB): Balanced (default)
- Large (1 GB): More cached tiles, faster panning
- Custom: Specify exact size
- Default: 500 MB

**Raster Resampling**

- Nearest: Fast, pixelated
- Bilinear: Smooth, moderate speed
- Bicubic: Smooth, slower
- Default: Bilinear

**Vector Simplification**

- Disabled: Render all vertices (accurate but slow)
- Low: Minimal simplification
- Medium: Moderate simplification
- High: Aggressive simplification (fast)
- Default: Medium

### Memory Management

**Edit → Preferences → Performance**

**Available RAM Display**

- Shows current memory usage
- Indicates available system memory

**Memory Limit**

- Automatic: Use up to 75% of available RAM
- Custom: Specify maximum MB to use
- Default: Automatic

**Garbage Collection**

- Automatic: Collect periodically (every 10 minutes)
- Manual: Collect on demand (Edit → Optimize Memory)
- Default: Automatic

### Feature Rendering

**Layer Properties → Advanced**

**Feature Count Limit**

- Load all: No limit (may be slow)
- Limit to: Maximum features to load
- Default: No limit

**Attribute Table Limit**

- Display first N rows: Speeds up display
- Default: 1000 rows

**Label Density**

- Low: Few labels (fast)
- Medium: Moderate labels (default)
- High: Many labels (slow)
- Default: Medium

---

## Data Source Configuration

Configure connections and default data sources.

### Database Connections

**File → Data Source → Configure Connections**

#### DuckDB

**Connection Properties**

```
Name: My DuckDB Database
Type: DuckDB
File Path: /path/to/database.duckdb
Read-Only: No
Max Pool Size: 10
```

**Add Connection**:

1. Click "Add New Connection"
2. Select "DuckDB"
3. Browse for .duckdb file
4. Click "Test Connection"
5. Click "Save"

#### Snowflake

**Connection Properties**

```
Name: My Snowflake Account
Type: Snowflake
Account: accountname (without .snowflakecomputing.com)
Warehouse: COMPUTE_WH
Database: GIS_DATA
Schema: PUBLIC
Username: [username]
Password: [password]
Role: SYSADMIN
```

**Add Connection**:

1. Click "Add New Connection"
2. Select "Snowflake"
3. Enter connection details
4. Click "Test Connection"
5. Click "Save"

**OAuth Authentication**:

1. Select "OAuth" for auth type
2. Snowflake redirects to OAuth URL
3. Authorize access
4. Connection saved

#### Databricks

**Connection Properties**

```
Name: My Databricks Workspace
Type: Databricks
Workspace URL: https://yourworkspace.cloud.databricks.com
Token: [personal access token]
Cluster: all-purpose-cluster-1
Catalog: main
Schema: default
```

**Get Token**:

1. Databricks Workspace → Settings → User Settings
2. Access Tokens → Generate Token
3. Copy token value
4. Use in application

**Add Connection**:

1. Click "Add New Connection"
2. Select "Databricks"
3. Enter workspace URL and token
4. Select cluster and catalog
5. Click "Test Connection"
6. Click "Save"

#### Apache Iceberg

**Connection Properties**

```
Type: Iceberg
Catalog Type: REST (or SQL, Hive, Nessie)
URI: http://localhost:8181
Warehouse: s3://mybucket/warehouse
S3 Access Key: [key]
S3 Secret Key: [secret]
```

**Add Connection**:

1. Click "Add New Connection"
2. Select "Apache Iceberg"
3. Choose catalog type
4. Enter connection details
5. Click "Test Connection"
6. Click "Save"

### Default Data Source

**Edit → Preferences → Data Sources**

**When Opening Data**:

- Check "Remember last used source"
- Or select default source (File, DuckDB, etc.)
- Affects file open dialog defaults

**Search Order for New Layers**:

1. Current project
2. Recent connections
3. File system
4. Configured databases

---

## Project Settings

Configure project-specific settings saved with project file.

### Project Properties

**File → Project Properties**

**Project Information**

- Name: Project title
- Description: Project summary
- Author: Creator name
- Version: Project version (e.g., 1.0)
- Created: Date created (auto)
- Modified: Last modified date (auto)

**Coordinate Reference System (CRS)**

- Current CRS: Active map CRS
- Change CRS: Button to change (dialog shows options)
- Default: EPSG:4326 (WGS 84)
- See [CRS_SUPPORT.md](CRS_SUPPORT.md) for details

**Project Extent**

- Auto: Calculate from layers
- Custom: Manually set bounds
- North, South, East, West: Enter coordinates

**Metadata**

- Keywords: Comma-separated tags
- Subject: Project subject area
- License: MIT, CC-BY, Commercial, etc.
- Credit/Attribution: Citation information

### Layer Settings

**Right-click Layer → Properties**

**Layer Information**

- Name: Layer display name
- Source: File path or connection string
- Format: Data format (Shapefile, GeoJSON, etc.)
- CRS: Coordinate system
- Extent: Geographic bounds
- Feature Count: Number of features

**Symbology Tab**

- Style: Color, symbol, classification
- Save as Style File: Save for reuse

**Rendering Tab**

- Visibility Range
- Blend mode
- Opacity
- Label settings

**Attributes Tab**

- Show/hide specific attribute columns
- Set alias (display name)
- Set field properties

---

## Advanced Settings

Configure advanced options for power users.

### Edit → Preferences → Advanced

**Debug Logging**

- Disabled: No debug output (default)
- Console: Output to console window
- File: Output to log file
- Level: Info, Warning, Error, Debug
- Default: Disabled

**Web Service Timeout**

- Range: 5-300 seconds
- Default: 30 seconds

**Network Proxy**

- None: Direct connection (default)
- Manual: Specify proxy server and port
- System: Use system proxy settings
- SOCKS: Specify SOCKS proxy

**Advanced Rendering**

- Multi-threading: Enable for faster rendering
- Vector tiles: Use vector format for web data
- WebGL: Use GPU acceleration (if available)

**Experimental Features**

- 3D Visualization: Beta 3D view mode
- Cloud Storage: Direct cloud file access
- AI Classification: ML-based feature classification
- Default: All disabled

### Keyboard Shortcuts

**View → Keyboard Shortcuts** or **Edit → Preferences → Keyboard**

**View & Navigate**
| Shortcut | Action |
|----------|--------|
| + | Zoom In |
| - | Zoom Out |
| 0 | Fit All |
| Enter | Zoom to Selection |
| Arrow Keys | Pan |
| Ctrl+0 | Reset Rotation |

**Tools**
| Shortcut | Action |
|----------|--------|
| I | Identify |
| S | Select |
| M | Measure |
| E | Edit Mode |
| D | Delete Feature |

**File Operations**
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Project |
| Ctrl+O | Open |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+Q | Quit |

**Editing**
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+X | Cut |
| Ctrl+C | Copy |
| Ctrl+V | Paste |

**Customize Shortcuts**:

1. Edit → Preferences → Keyboard
2. Find action in list
3. Click shortcut field
4. Enter new shortcut
5. Click Save

### Plugins & Extensions

**Edit → Preferences → Plugins**

**Available Plugins**

- Plugin Name: Description
- Author: Developer
- Version: Current version
- Status: Enabled/Disabled (checkbox)
- Install/Uninstall buttons

**Manage Plugins**

1. Browse list of installed plugins
2. Check/uncheck to enable/disable
3. Click "Install" for new plugins
4. Click "Remove" to uninstall
5. Restart for changes to take effect

**Plugin Settings**

- Some plugins have settings
- Right-click plugin → Settings
- Configure plugin-specific options

---

## Configuration Files

Application and project configuration files.

### Configuration File Locations

**Windows**

```
%APPDATA%\GISMapViewer\config.json       Main configuration
%APPDATA%\GISMapViewer\connections.json  Database connections
%APPDATA%\GISMapViewer\themes.json       Theme customizations
%APPDATA%\GISMapViewer\plugins\          Installed plugins
```

**macOS**

```
~/Library/Application Support/GISMapViewer/config.json
~/Library/Application Support/GISMapViewer/connections.json
~/Library/Application Support/GISMapViewer/themes.json
~/Library/Application Support/GISMapViewer/plugins/
```

**Linux**

```
~/.config/GISMapViewer/config.json
~/.config/GISMapViewer/connections.json
~/.config/GISMapViewer/themes.json
~/.config/GISMapViewer/plugins/
```

### config.json

**Main application configuration**:

```json
{
  "version": "1.0.0",
  "theme": "light",
  "language": "en",
  "units": "metric",
  "defaultCRS": "EPSG:4326",
  "recentProjects": ["/path/to/project1.gmp", "/path/to/project2.gmp"],
  "windowGeometry": {
    "width": 1280,
    "height": 720,
    "x": 100,
    "y": 100
  },
  "performance": {
    "hardwareAcceleration": true,
    "tileCache": 524288000,
    "maxMemoryUsage": 2147483648,
    "vectorSimplification": "medium"
  },
  "display": {
    "backgroundColor": "#E8E8E8",
    "showScaleBar": true,
    "showCoordinates": true,
    "showAttribution": true
  }
}
```

### connections.json

**Database connection definitions**:

```json
{
  "connections": [
    {
      "name": "Local DuckDB",
      "type": "duckdb",
      "filePath": "/Users/user/data.duckdb",
      "readOnly": false
    },
    {
      "name": "Production Snowflake",
      "type": "snowflake",
      "account": "accountname",
      "warehouse": "COMPUTE_WH",
      "database": "GIS_DATA",
      "schema": "PUBLIC",
      "username": "user@example.com"
    }
  ]
}
```

### themes.json

**Custom theme definitions**:

```json
{
  "themes": [
    {
      "name": "Custom Dark",
      "colors": {
        "background": "#1E1E1E",
        "foreground": "#FFFFFF",
        "primary": "#0078D4",
        "secondary": "#50E6FF"
      },
      "fonts": {
        "ui": "Segoe UI",
        "monospace": "Courier New"
      }
    }
  ]
}
```

### Project File (\*.gmp)

**Project files store settings**:

```json
{
  "name": "My GIS Project",
  "version": "1.0",
  "crs": "EPSG:4326",
  "extent": {
    "north": 40.0,
    "south": 39.0,
    "east": -73.0,
    "west": -74.0
  },
  "layers": [
    {
      "name": "Base Map",
      "source": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "type": "wmts",
      "opacity": 1.0,
      "visible": true
    },
    {
      "name": "Survey Data",
      "source": "/data/survey.shp",
      "type": "shapefile",
      "style": {
        "color": "#FF0000",
        "size": 5
      }
    }
  ]
}
```

---

## Preferences Storage

How preferences are stored and synchronized.

### Preference Types

**Application Preferences**

- Stored in `config.json`
- Apply to all projects
- Examples: theme, language, default CRS

**Project Preferences**

- Stored in project file (\*.gmp)
- Specific to each project
- Examples: map extent, layer visibility, styles

**Connection Preferences**

- Stored in `connections.json`
- Stored separately for security
- Database credentials (encrypted if possible)

### Backup and Restore

**Backup Preferences**:

1. File → Export Preferences
2. Select location to save
3. File saved as `.pref` archive

**Restore Preferences**:

1. File → Import Preferences
2. Select `.pref` file
3. Choose what to restore:
   - Application settings
   - Connections
   - Themes
   - All
4. Click Restore

**Manual Backup**:

```bash
# Windows
copy %APPDATA%\GISMapViewer\config.json backup_config.json

# macOS/Linux
cp ~/Library/Application\ Support/GISMapViewer/config.json backup_config.json
```

### Reset to Defaults

**Edit → Preferences → General → Reset Defaults**

Options:

- Reset all settings to defaults
- Keep connections
- Keep themes
- Full reset (removes all customization)

**Manual Reset**:

1. Close application
2. Delete configuration directory
3. Restart application (recreates defaults)

---

## Environment Variables

Control behavior via environment variables (for advanced users).

**Debug Settings**

```bash
GIS_DEBUG=1                # Enable debug mode
GIS_LOG_LEVEL=debug        # Set log verbosity
GIS_LOG_FILE=/path/to.log  # Custom log location
```

**Performance**

```bash
GIS_MAX_MEMORY=4096        # Max RAM in MB
GIS_CACHE_SIZE=1000        # Tile cache in MB
GIS_THREADS=4              # Parallel threads
```

**Proxy Configuration**

```bash
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
NO_PROXY=localhost,127.0.0.1
```

**GDAL/OGR Configuration**

```bash
GDAL_DATA=/path/to/gdal/data
PROJ_LIB=/path/to/proj/share
CPL_DEBUG=ON
```

---

## Tips and Tricks

### Performance Optimization

1. **Large Project**
   - Disable vector simplification
   - Increase memory limit
   - Use indexed GeoPackage format
   - Split into smaller projects

2. **Slow Rendering**
   - Enable hardware acceleration
   - Reduce label density
   - Use raster backgrounds instead of many vector layers
   - Increase tile cache size

3. **Network Performance**
   - Increase web service timeout
   - Use local cache for frequently accessed data
   - Configure proxy if behind firewall

### Customization Ideas

1. **Color Scheme**
   - Create custom theme for organization branding
   - Save multiple themes for different projects
   - Export theme for sharing with team

2. **Keyboard Shortcuts**
   - Customize for your workflow
   - Save custom shortcut set
   - Import shared shortcuts from team

3. **Startup Configuration**
   - Set default data source
   - Load project template on startup
   - Configure default symbology

---

**Last Updated**: February 2026  
**Documentation Version**: 1.0.0

For more information, see [USAGE.md](USAGE.md) for common workflows.
