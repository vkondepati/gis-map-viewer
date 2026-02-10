# Editing Guide

Complete guide to creating, modifying, and managing vector features in Desktop GIS Map Viewer.

## Table of Contents

- [Enabling Edit Mode](#enabling-edit-mode)
- [Creating Features](#creating-features)
- [Modifying Features](#modifying-features)
- [Batch Operations](#batch-operations)
- [Validation and Repair](#validation-and-repair)
- [Best Practices](#best-practices)

## Enabling Edit Mode

### Prepare for Editing

1. **Open a layer** that supports editing (e.g., Shapefile, GeoPackage, GeoJSON)
2. **Right-click** layer in Layers panel
3. **Select "Enable Editing"** or click Edit Mode button
4. **Confirm** - layer is now editable

### Editable Layer Types

| Format          | Editable | Notes                        |
| --------------- | -------- | ---------------------------- |
| Shapefile       | ✅       | Must have .prj file          |
| GeoJSON         | ✅       | Saves to file                |
| GeoPackage      | ✅       | Full read/write support      |
| CSV             | ❌       | Create new Shapefile instead |
| Web services    | ❌       | Download as GeoJSON first    |
| Data warehouses | ❌       | Export and edit locally      |

### Keyboard Shortcuts for Editing

| Action           | Shortcut |
| ---------------- | -------- |
| Enable Edit Mode | Ctrl+E   |
| Save Changes     | Ctrl+S   |
| Undo             | Ctrl+Z   |
| Redo             | Ctrl+Y   |
| Delete Feature   | Delete   |
| Copy Feature     | Ctrl+C   |
| Paste Feature    | Ctrl+V   |

## Creating Features

### Create Point Features

1. **Enable Edit Mode** on target layer
2. **Click "Create Point"** tool in toolbar or press P
3. **Click on map** to place point
4. **Enter attributes** in pop-up dialog:
   - Mandatory fields required
   - Optional fields can be left blank
5. **Click Save**
6. New point appears on map

### Create Line Features

1. **Enable Edit Mode**
2. **Click "Create Line"** tool or press L
3. **Click multiple points** on map to define line:
   - Each click adds a vertex
   - Line previews in real-time
4. **Double-click** or press Enter to finish
5. **Enter attributes** in dialog
6. **Click Save**

**Tips**:

- Minimum 2 points for valid line
- Click near existing vertices to extend line
- Right-click to undo last point

### Create Polygon Features

1. **Enable Edit Mode**
2. **Click "Create Polygon"** tool or press G
3. **Click points** to define boundary:
   - Creates vertices
   - Line shows boundary
4. **Double-click** or press Enter to complete
5. **Polygon automatically closes**
6. **Enter attributes** in dialog
7. **Click Save**

**Tips**:

- Minimum 3 points for valid polygon
- Vertices must not cross
- Clockwise vs counter-clockwise doesn't matter
- Right-click to undo last point

### Batch Create from Template

Create multiple features with same attributes:

1. **Edit** → **Batch Create**
2. **Enter template attributes**
3. **Select geometry type** (point, line, polygon)
4. **Create each feature** individually
5. **Finish** when done

## Modifying Features

### Edit Geometry

Change the shape of existing features.

1. **Enable Edit Mode**
2. **Click "Edit Feature"** tool or press E
3. **Click feature** on map
4. **Vertices appear** as draggable points
5. **Drag vertices** to move them
6. **Click edge to add** new vertex
7. **Click vertex to delete** (or press Delete)
8. **Click Save** or press Enter

**Advanced Operations**:

- **Ctrl+drag**: Constrain to horizontal/vertical
- **Shift+drag**: Fine-tune with arrow keys
- **Right-click vertex**: Delete single vertex

### Edit Attributes

Modify feature properties and data.

1. **Enable Edit Mode**
2. **Click "Edit Attributes"** tool
3. **Click feature** on map
4. **Edit Attributes panel** appears
5. **Modify field values**:
   - Single-line text: Free text entry
   - Multi-line text: Text area
   - Numbers: Numeric input
   - Date: Date picker
   - Boolean: Checkbox
   - Dropdown: Select from list
6. **Click Save**

### Delete Features

Remove features from layer.

**Method 1 - Edit Mode**:

1. **Enable Edit Mode**
2. **Click feature** on map
3. **Press Delete** or right-click → Delete
4. **Confirm** deletion

**Method 2 - Identify and Delete**:

1. **Identify feature** (press I)
2. **Feature Info panel** appears
3. **Click Delete** button
4. **Confirm** deletion

## Batch Operations

### Batch Attribute Update

Update multiple features at once.

1. **Enable Edit Mode**
2. **Edit** → **Batch Update**
3. **Select features**:
   - Enter WHERE clause: `population > 100000`
   - OR select manually from map
4. **Set new attribute values**
5. **Preview changes** in dialog
6. **Click Apply** to update all

### Batch Geometry Transform

Apply transformations to multiple features.

1. **Enable Edit Mode**
2. **Select features** to transform
3. **Edit** → **Transform Geometries**
4. **Choose transformation**:
   - **Rotate**: Enter angle in degrees
   - **Scale**: Enter scale factor (e.g., 1.5)
   - **Translate**: Enter X,Y offsets
5. **Preview** result
6. **Click Apply**

### Batch Delete

Delete multiple features by criteria.

1. **Enable Edit Mode**
2. **Select features** to delete:
   - By query: Use attribute query
   - By geometry: Rectangle select
3. **Edit** → **Batch Delete**
4. **Confirm** deletion

### Copy Features Between Layers

1. **Select features** in source layer
2. **Edit** → **Copy**
3. **Switch to target layer**
4. **Edit** → **Paste**
5. Features copied with attributes

## Validation and Repair

### Check Geometry Validity

Identify and fix geometry issues.

1. **Enable Edit Mode**
2. **Edit** → **Validate Geometries**
3. Validator checks for:
   - Self-intersecting polygons
   - Invalid coordinate ranges
   - Unclosed rings
   - Duplicate vertices
   - Invalid geometry types
4. **Report shows issues** with locations
5. **Option to auto-fix** common problems

### Repair Invalid Geometries

Fix common geometry problems.

1. **Select problematic features**
2. **Edit** → **Repair Geometries**
3. **Choose repair strategy**:
   - **Remove Self-Intersections**: Use buffer approach
   - **Close Open Rings**: Complete polygon boundaries
   - **Remove Duplicate Vertices**: Clean up vertices
   - **Snap to Grid**: Align to grid
4. **Preview** repairs
5. **Click Apply**

### Simplify Geometries

Reduce complexity while preserving shape.

1. **Select features**
2. **Edit** → **Simplify Geometries**
3. **Set tolerance** (in map units):
   - Higher tolerance = more simplification
   - Lower tolerance = more detail
4. **Choose algorithm**:
   - Douglas-Peucker (default)
   - Visvalingam-Whyatt
5. **Preview** result
6. **Click Apply**

## Best Practices

### Before Editing

1. **Back up original data** - Save copy before editing
2. **Verify CRS** - Ensure correct coordinate system
3. **Check data** - Validate for errors first
4. **Document changes** - Track modifications

### During Editing

1. **Use snapping** - Enable vertex snapping to align features:
   - Edit → Preferences → Editing
   - Set snap tolerance
   - Enable snap to vertex/edge
2. **Validate frequently** - Check geometries as you edit
3. **Use templates** - For repeated feature creation
4. **Save regularly** - Don't lose work: Ctrl+S
5. **Use undo liberally** - Ctrl+Z is your friend

### Attribute Editing Tips

1. **Use dropdown lists** - When available for consistency
2. **Validate values** - Enter realistic values
3. **Fill required fields** - Don't leave mandatory fields empty
4. **Use consistent formats** - Dates, phone numbers, etc.
5. **Document units** - Meters, feet, degrees, etc.

### Geometry Editing Tips

1. **Zoom in** for precise editing
2. **Use grid snapping** for alignment
3. **Avoid crossing boundaries** (for polygons)
4. **Check topology** after major edits
5. **Use simplification** for complex geometries

### Performance During Editing

1. **Hide unnecessary layers** - Focus on editing layer
2. **Limit visible features** - Zoom to work area
3. **Disable labels** temporarily
4. **Disable complex styling**
5. **Use GeoPackage** format (faster than Shapefile)

## Workflows

### Adding New Survey Data

1. **Create new layer** from scratch
2. **Define schema** (attributes/fields)
3. **Enable Edit Mode**
4. **Create features** from survey points/sketches
5. **Enter attributes** for each feature
6. **Validate geometries**
7. **Save and export**

### Updating Existing Dataset

1. **Open existing layer**
2. **Enable Edit Mode**
3. **Edit features** as needed:
   - Modify attributes
   - Update geometries
   - Add new features
   - Delete obsolete features
4. **Validate changes**
5. **Review and approve** changes
6. **Save**

### Fixing Topology Errors

1. **Validate Geometries** - Identify problems
2. **Repair Geometries** - Auto-fix where possible
3. **Manual Editing** - Edit vertices where needed
4. **Re-validate** - Confirm fixes
5. **Document changes** - Record what was fixed

## Export and Sharing

### Save Edited Data

**To Shapefile**:

1. Right-click layer → Export
2. Select Shapefile format
3. Choose save location
4. Includes .prj file for CRS

**To GeoJSON**:

1. Right-click layer → Export
2. Select GeoJSON format
3. Saves as single file

**To GeoPackage**:

1. Right-click layer → Export
2. Select GeoPackage format
3. Can include multiple layers
4. Better for collaboration

### Version Control

Track changes over time:

1. Save versions with timestamps
2. Keep backup of original
3. Document changes in changelog
4. Use GeoPackage for version history

### Sharing Edits

1. **Export to GeoJSON** - Web-friendly format
2. **Export to GeoPackage** - Full preservation
3. **Share shapefile** - With all components (.shp, .shx, .dbf, .prj)
4. **Upload to server** - For team collaboration

---

For more help, see [FEATURES.md](FEATURES.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
