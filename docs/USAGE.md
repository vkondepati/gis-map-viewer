# Usage Guide

Quick start and common workflows for using Desktop GIS Map Viewer.

## Table of Contents

- [Quick Start](#quick-start)
- [Opening Data](#opening-data)
- [Basic Operations](#basic-operations)
- [Common Workflows](#common-workflows)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Tricks](#tips-and-tricks)

## Quick Start

### First Launch

1. **Launch the application**
2. Welcome screen appears
3. **Create New Project** or **Open Recent**
4. Give your project a name
5. Configure default coordinate system (default: WGS 84)
6. Click **Create**

### Load Your First Dataset

1. **File** → **Open Data Layer**
2. Browse to your data file (.shp, .geojson, .csv, etc.)
3. Click **Open**
4. Configure import if needed:
   - Select coordinate system
   - Map CSV columns (for CSV files)
   - Choose geometry column
5. Click **Import**
6. Layer appears on map!

### Explore the Map

- **Zoom**: Scroll wheel or toolbar buttons
- **Pan**: Click and drag on map
- **Identify**: Click "I" button, then click features
- **Select**: Click "S" button, then click/drag to select

## Opening Data

### From File System

**Supported Formats**:

- Shapefiles (.shp with .shx, .dbf)
- GeoJSON (.geojson, .json)
- CSV files (.csv, .txt)
- KML/KMZ files
- GeoPackage (.gpkg)

**Steps**:

```
File → Open Data Layer
↓
Browse and select file
↓
Configure import settings
↓
Click Open
```

### From Web Services

**Steps**:

```
File → Add Web Layer
↓
Select service type (WMS, WFS, WMTS, etc.)
↓
Enter service URL
↓
Select layers
↓
Configure parameters
↓
Click Add to Map
```

### From Data Warehouse

**Steps**:

```
File → Add Data Warehouse Layer
↓
Select source (DuckDB, Snowflake, Databricks, Iceberg)
↓
Enter connection details
↓
Write or select SQL query
↓
Click Load
```

See [DATA_WAREHOUSES.md](DATA_WAREHOUSES.md) for detailed instructions.

## Basic Operations

### Map Navigation

| Action            | How                                      |
| ----------------- | ---------------------------------------- |
| Zoom In           | Scroll up OR Click + button OR Press +   |
| Zoom Out          | Scroll down OR Click - button OR Press - |
| Pan               | Click+Drag OR Arrow keys                 |
| Fit All           | Click Fit button OR Menu: View → Fit All |
| Zoom to Selection | Selected features OR Toolbar button      |

### Identifying Features

1. Click **Identify** button (or press I)
2. Click a feature on the map
3. **Feature Info Panel** shows:
   - Geometry type
   - All attributes
   - Spatial coordinates
4. Double-click attribute to edit (if editing enabled)

### Selecting Features

**Single Selection**:

1. Click feature directly
2. Feature highlights
3. Selection appears in Layers panel

**Rectangle Selection**:

1. Click **Rectangle Select** tool
2. Click and drag to define area
3. All features in area select

**Attribute Query**:

1. Right-click layer
2. Select "Query Layer"
3. Enter WHERE clause: `population > 100000`
4. Click Execute

**Clear Selection**:

- Edit → Clear Selection
- Or click "Clear" in Layers panel

### Layer Management

**Add Layer**:

```
File → Open Data Layer
```

**Remove Layer**:

```
Right-click layer → Remove Layer
```

**Change Order**:

```
Drag layer up/down in Layers panel
```

**Toggle Visibility**:

```
Click eye icon next to layer name
```

**Style Layer**:

```
Right-click layer → Properties → Symbology
```

## Common Workflows

### Viewing Satellite Imagery with Features

1. Add basemap:
   - File → Add Web Layer → XYZ Tiles
   - Enter: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
   - Click Add

2. Load your vector data:
   - File → Open Data Layer
   - Select your GeoJSON file
   - Click Open

3. Adjust layer transparency:
   - Right-click feature layer → Properties
   - Set Opacity to 70%

### Querying Data Warehouse

1. File → Add Data Warehouse Layer → [Platform]
2. Enter connection details
3. Write query:
   ```sql
   SELECT name, population, ST_ASGEOJSON(geom)
   FROM cities
   WHERE country = 'USA'
   ```
4. Click Load

### Creating a Styled Map

1. **Load your data** - Open layer
2. **Style the layer**:
   - Right-click → Properties
   - Go to "Symbology" tab
   - Choose styling type (single, classified, graduated)
3. **Add labels**:
   - Go to "Labels" tab
   - Enable labels
   - Choose which column to display
4. **Add title and legend**:
   - File → Export → Save as Image

### Analyzing Spatial Relationships

1. **Load multiple layers** - Add layers to analyze
2. **Select features** - Use query or selection tool
3. **Run analysis**:
   - Menu: Analysis → [Operation]
   - Buffer, Intersection, Union, etc.
4. **Review results** - New layer created with output

### Editing Survey Data

1. **Create new layer** - File → New Layer
2. **Enable Edit Mode** - Right-click layer → Edit
3. **Create features** - Point, line, polygon tools
4. **Add attributes** - Fill in feature data
5. **Validate** - Edit → Validate Geometries
6. **Save** - File → Save Project

## Keyboard Shortcuts

### Navigation

- `+` / `=` - Zoom in
- `-` - Zoom out
- Arrow keys - Pan
- `Ctrl+F` - Fit to extent

### Tools

- `I` - Identify tool
- `S` - Select tool
- `M` - Measure tool
- `P` - Create point
- `L` - Create line
- `G` - Create polygon
- `E` - Edit feature

### Editing

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Delete` - Delete selected feature
- `Ctrl+C` - Copy feature
- `Ctrl+V` - Paste feature

### Files

- `Ctrl+O` - Open file
- `Ctrl+S` - Save project
- `Ctrl+N` - New project
- `Ctrl+E` - Enable edit mode

### Help

- `F1` - Show help

## Tips and Tricks

### Performance

**For Large Files**:

1. Convert to GeoPackage format (faster)
2. Enable simplification: Edit → Preferences → Performance
3. Hide unnecessary layers
4. Limit features visible: Edit → Preferences

**For Web Services**:

1. Add spatial filter to WFS queries
2. Use smaller zoom levels initially
3. Cache tiles locally
4. Use WMTS instead of WMS when available

### Data Validation

**Before Publishing**:

1. Edit → Validate Geometries
2. Check for self-intersections
3. Verify attribute values
4. Test with sample data

**Export for Sharing**:

1. Right-click layer
2. Select "Export"
3. Choose format (Shapefile, GeoJSON, GeoPackage)
4. Save with meaningful name

### Efficient Workflows

**Template Projects**:

1. Create project with basemaps configured
2. Save as template
3. Reuse for new projects

**Saved Queries**:

1. Create frequently-used SQL queries
2. Save as snippets
3. Reuse for analysis

**Custom Styles**:

1. Style a layer
2. Save style configuration
3. Apply to other similar layers

### Troubleshooting

**Data Won't Load**:

- Check file format and encoding
- Verify CRS is correct
- Look at error message for clues
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Slow Performance**:

- Hide unnecessary layers
- Enable simplification
- Use smaller dataset
- Check system resources

**Features Appear in Wrong Location**:

- Verify CRS setting
- Check coordinate order
- Ensure lat/long are correct

---

For more detailed guidance, see other documentation files:

- [FEATURES.md](FEATURES.md) - All available features
- [EDITING.md](EDITING.md) - Feature creation and editing
- [DATA_WAREHOUSES.md](DATA_WAREHOUSES.md) - Data warehouse queries
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem solving
