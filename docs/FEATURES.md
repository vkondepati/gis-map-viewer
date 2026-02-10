# Features Guide

Comprehensive documentation of all Desktop GIS Map Viewer features.

## Table of Contents

- [Map Navigation](#map-navigation)
- [Layer Management](#layer-management)
- [Styling and Symbology](#styling-and-symbology)
- [Identifying and Selecting Features](#identifying-and-selecting-features)
- [Spatial Analysis](#spatial-analysis)
- [Feature Editing](#feature-editing)

## Map Navigation

### Zoom Controls

Zoom in and out to see features at different scales.

- **Mouse Scroll**: Scroll up to zoom in, scroll down to zoom out
- **Toolbar Buttons**: Click + or - buttons for discrete zoom levels
- **Keyboard**: Press +/= to zoom in, - to zoom out
- **Fit to Extent**: Auto-zoom to show all loaded layers
- **Zoom to Selection**: Focus map on selected features
- **Predefined Scales**: Quick access to common scales (1:1000, 1:5000, 1:10000, etc.)

### Pan Operations

Move around the map to explore different areas.

- **Click and Drag**: Click and drag to pan across the map
- **Arrow Keys**: Use keyboard for precise panning (up, down, left, right)
- **Pan Tool**: Activate dedicated pan mode from toolbar
- **Smart Boundaries**: Application prevents panning beyond world extent

### Identify Features

Click on features to view their attributes and properties.

**How to Use**:

1. Click "Identify Tool" in toolbar or press 'I'
2. Click on map feature
3. Feature Info Panel displays:
   - Feature geometry type
   - All attribute values
   - Spatial coordinates
   - Related features

**Double-click** attribute values to edit them (if editing enabled).

## Layer Management

### Adding Layers

Load data from various sources to your map.

**From Files**:

1. File → Open Data Layer
2. Browse to data file (.shp, .geojson, .csv, etc.)
3. Select and click Open
4. Configure import settings if prompted
5. Layer appears in Layers panel and on map

**From Web Services**:

1. File → Add Web Layer
2. Select service type (WMS, WFS, WMTS, REST API)
3. Enter service URL
4. Review available layers
5. Select layers to add
6. Configure parameters
7. Click Add to Map

**From Data Warehouse**:

1. File → Add Data Warehouse Layer
2. Select source (DuckDB, Snowflake, Databricks, Iceberg)
3. Enter connection details
4. Write or select SQL query
5. Click Load

### Removing Layers

Delete layers from the map.

1. Right-click layer in Layers panel
2. Click "Remove Layer"
3. Confirm removal

### Reordering Layers

Change the drawing order of layers.

1. Click layer in Layers panel
2. Drag up/down to reorder
3. Map refreshes automatically

### Visibility Toggle

Show or hide individual layers.

1. Click eye icon next to layer name
2. Layer immediately shows or hides
3. No data loss when hidden

### Layer Properties

Configure layer appearance and behavior.

1. Right-click layer in Layers panel
2. Click "Properties"
3. Adjust settings:
   - Opacity (0-100%)
   - Blend mode
   - Display name
   - Metadata

## Styling and Symbology

Customize how features appear on the map.

### Basic Styling

Configure colors, line styles, and fill patterns.

1. Right-click layer in Layers panel
2. Click "Properties" → "Symbology"
3. Configure:
   - **Fill Color**: Choose fill color for polygons
   - **Fill Pattern**: Optional pattern overlay
   - **Line Color**: Edge color for features
   - **Line Width**: Thickness (in pixels)
   - **Line Style**: Solid, dashed, dotted
   - **Point Size**: Radius for point features
   - **Point Symbol**: Shape (circle, square, triangle, etc.)

### Classified Rendering

Style features based on attribute values (categories).

1. Right-click layer → Properties → Symbology
2. Select "Classified" style type
3. Choose attribute column to classify by
4. Assign colors to each category
5. Click Apply

### Graduated Colors

Create color ramps for continuous numeric data.

1. Right-click layer → Properties → Symbology
2. Select "Graduated Colors" style type
3. Choose numeric column
4. Select classification method:
   - Equal Interval
   - Quantile
   - Natural Breaks (Jenks)
   - Standard Deviation
5. Choose color ramp
6. Adjust number of classes
7. Click Apply

### Unique Values

Apply different symbols for distinct attribute values.

1. Right-click layer → Properties → Symbology
2. Select "Unique Values" style type
3. Choose column with unique values
4. Assign symbol to each value
5. Click Apply

### Data-Driven Styling

Bind visual properties directly to attributes.

1. Right-click layer → Properties → Symbology
2. Click "Advanced Options"
3. Create expressions:
   - `color: if(population > 100000, 'red', 'blue')`
   - `size: population / 1000`
   - `opacity: if(active == true, 1, 0.5)`
4. Click Apply

### Label Configuration

Add text labels to features.

1. Right-click layer → Properties → Labels
2. Enable: "Label features"
3. Select attribute column for label text
4. Configure:
   - Font and size
   - Color and halo
   - Position (above, below, center)
   - Rotation
   - Max label length
5. Click Apply

## Identifying and Selecting Features

### Selection Tools

Multiple ways to select features.

#### Point Selection

1. Click "Point Select" tool
2. Click individual feature
3. Feature highlights on map
4. Attributes display in panel

#### Rectangle Selection

1. Click "Rectangle Select" tool
2. Click and drag to define area
3. All features in rectangle select
4. Selected features highlight

#### Polygon Selection

1. Click "Polygon Select" tool
2. Click to define vertices
3. Double-click to complete boundary
4. Features inside polygon select

#### Free-hand Selection

1. Click "Free-hand Select" tool
2. Draw selection boundary freehand
3. Release to complete
4. Matching features select

#### Query by Attribute

1. Right-click layer in Layers panel
2. Select "Query Layer"
3. Enter WHERE clause:
   - `population > 10000`
   - `state = 'California'`
   - `name LIKE '%ville'`
4. Click Execute
5. Matching features select

#### Invert Selection

1. Edit → Invert Selection
2. All selected become unselected, unselected become selected
3. Useful for working with exclusions

#### Clear Selection

1. Edit → Clear Selection
2. Or click "Clear" button in Layers panel
3. All features deselect

## Spatial Analysis

Analyze spatial relationships and derive new data.

### Buffer Operation

Create a buffer zone around features.

1. Menu: Analysis → Buffer
2. Select layer to buffer
3. Set buffer distance (in map units)
4. Choose output location and format
5. Click Execute
6. New buffered layer created

**Use Cases**: Service areas, impact zones, proximity analysis

### Intersection

Find overlapping areas between two layers.

1. Menu: Analysis → Intersection
2. Select two layers to intersect
3. Configure output fields
4. Choose output format
5. Click Execute
6. Result layer created with intersection geometries

**Use Cases**: Overlap analysis, map combining

### Union

Merge features from two layers.

1. Menu: Analysis → Union
2. Select two layers
3. Configure output fields
4. Click Execute
5. Result layer created with combined features

**Use Cases**: Regional consolidation, boundary merging

### Difference

Find areas in one layer not overlapped by another.

1. Menu: Analysis → Difference
2. Select source and difference layers
3. Click Execute
4. Result shows only non-overlapping parts

**Use Cases**: Exclusion analysis, gap identification

### Distance Measurement

Measure distances between map features.

1. Click "Measure" tool
2. Click points on map to measure
3. Distance displays in status bar
4. Right-click to finish
5. Can switch between:
   - Kilometers
   - Miles
   - Meters
   - Feet

## Feature Editing

Create and modify geographic features (in edit mode).

See [EDITING.md](EDITING.md) for complete editing guide.

### Quick Summary

- **Create Points**: Click "Create Point" tool, click on map
- **Create Lines**: Click "Create Line" tool, click multiple points
- **Create Polygons**: Click "Create Polygon" tool, define boundary
- **Edit Geometry**: Click "Edit Feature" tool, drag vertices
- **Edit Attributes**: Click "Edit Attributes" tool, modify values
- **Delete Features**: Select feature, press Delete
- **Batch Operations**: Transform multiple features at once

## Advanced Features

### Custom Styling Files

Use SLD (Styled Layer Descriptor) for complex styling:

- XML-based styling standard
- OGC-compliant format
- Supports advanced rendering rules

### Integration with External Tools

- Export to QGIS projects (.qgs)
- Import ArcGIS layer files (.lyr)
- Mapbox GL style compatibility
- Web layer definitions

### Scripting

Use Python console for automation:

```python
# Access map object
map.fitExtent([-180, -90, 180, 90])

# Load and style layer
layer = map.addLayer('cities.geojson')
layer.setStyle({'color': 'red', 'weight': 3})

# Spatial query
results = layer.queryFeatures({'population': {'>': 100000}})
```

## Performance Tips

- **Use filters**: Apply WHERE clauses before loading large datasets
- **Simplify geometries**: Reduce detail for better performance
- **Hide layers**: Temporarily hide large datasets not needed
- **Use indexed columns**: Speed up attribute queries
- **Cache tiles**: Enable tile caching for web services
- **Limit features**: Set max features to render in preferences

## Keyboard Shortcuts

| Action   | Shortcut   |
| -------- | ---------- |
| Zoom In  | +/= key    |
| Zoom Out | - key      |
| Pan      | Arrow keys |
| Identify | I          |
| Select   | S          |
| Measure  | M          |
| Undo     | Ctrl+Z     |
| Redo     | Ctrl+Y     |
| Save     | Ctrl+S     |
| Open     | Ctrl+O     |
| Help     | F1         |

---

For more information on specific topics, see related documentation files.
