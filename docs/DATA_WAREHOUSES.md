# Data Warehouse and Data Lake Integration

Query spatial data directly from cloud data platforms: DuckDB, Snowflake, Databricks, and Apache Iceberg.

## Table of Contents

- [Overview](#overview)
- [DuckDB Integration](#duckdb-integration)
- [Snowflake Integration](#snowflake-integration)
- [Databricks Integration](#databricks-integration)
- [Apache Iceberg Integration](#apache-iceberg-integration)
- [Connection Management](#connection-management)
- [Querying and Filtering](#querying-and-filtering)
- [Performance Tips](#performance-tips)
- [Troubleshooting](#troubleshooting)

## Overview

Modern GIS workflows often involve querying spatial data stored in data warehouses. Desktop GIS Map Viewer seamlessly integrates with major cloud data platforms to load and visualize geospatial data.

### Why Use Data Warehouses?

- **Centralized Storage**: Keep data in one authoritative location
- **Scalability**: Handle massive datasets efficiently
- **Real-time Updates**: Always work with latest data
- **Collaboration**: Multiple teams access same data
- **Security**: Enterprise authentication and encryption
- **Cost Efficiency**: Avoid data duplication

### Supported Platforms

| Platform       | Type           | Best For                    | Cost           |
| -------------- | -------------- | --------------------------- | -------------- |
| **DuckDB**     | In-process DB  | Local analysis, prototyping | Free           |
| **Snowflake**  | Cloud DW       | Enterprise data warehouse   | Per compute    |
| **Databricks** | Cloud Platform | Big data + ML + BI          | Per DBU        |
| **Iceberg**    | Table Format   | Data lake, time travel      | Infrastructure |

## DuckDB Integration

DuckDB is an in-process SQL database with powerful spatial extensions.

### When to Use DuckDB

- Working with local spatial files
- Quick data exploration and analysis
- Prototyping GIS workflows
- Teaching and learning SQL
- Small to medium datasets
- No cloud infrastructure needed

### Installation

DuckDB support is included by default. No additional setup required.

### Creating a DuckDB Connection

#### Method 1: GUI

1. **File** → **Add Data Warehouse Layer** → **DuckDB**
2. **Select DuckDB file** or **Create new in-memory database**
3. **Click Connect**

#### Method 2: Python

```python
from gis_viewer.connectors import DuckDBConnector

# File-based
duckdb = DuckDBConnector(database="~/spatial_data.db")

# In-memory
duckdb = DuckDBConnector(memory=True)
```

#### Method 3: API

```javascript
const duckdb = new DuckDBConnector({
  database: "path/to/spatial.db",
  // OR for in-memory
  memory: true,
});
```

### Querying DuckDB

#### Loading a Table as Layer

```javascript
duckdb
  .loadTable("cities", {
    geometryColumn: "geom",
    style: { color: "blue", radius: 5 },
  })
  .then((layer) => map.addLayer(layer));
```

#### SQL Query with Geometry

```javascript
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
```

#### Spatial Functions

```sql
-- Buffer
SELECT ST_Buffer(geom, 1000) FROM features;

-- Intersection
SELECT ST_Intersection(a.geom, b.geom)
FROM layer_a a, layer_b b;

-- Distance
SELECT ST_Distance(geom1, geom2) FROM points;

-- Spatial join
SELECT a.*, b.name
FROM layer_a a
JOIN layer_b b ON ST_Intersects(a.geom, b.geom);
```

### DuckDB Spatial Functions

See [DuckDB Spatial Extension Documentation](https://duckdb.org/docs/extensions/spatial)

## Snowflake Integration

Snowflake is a cloud data warehouse with native geographic support.

### When to Use Snowflake

- Enterprise data warehouse
- Multi-team collaboration
- Large-scale spatial datasets
- Governed data access
- Integration with BI tools
- Need for failover/backup

### Setup

#### Step 1: Get Connection Details

From Snowflake admin:

- **Account Identifier**: `xy12345.us-east-1`
- **Warehouse**: `COMPUTE_WH`
- **Database**: `GIS_DB`
- **Schema**: `PUBLIC`
- **Username** and **Password** (or SSO)

#### Step 2: Configure Connection

**GUI Method**:

1. **File** → **Add Data Warehouse Layer** → **Snowflake**
2. **Enter Account Identifier**
3. **Enter Username and Password**
4. **Select Warehouse**
5. **Select Database and Schema**
6. **Click Connect**

**API Method**:

```javascript
const snowflake = new SnowflakeConnector({
  account: "xy12345.us-east-1",
  user: "gis_user",
  password: "password",
  warehouse: "COMPUTE_WH",
  database: "GIS_DB",
  schema: "PUBLIC",
});
```

### Querying Snowflake

#### Load Table

```javascript
snowflake
  .loadTable("countries", {
    geometryColumn: "geom",
    style: { fillColor: "green", weight: 1 },
  })
  .then((layer) => map.addLayer(layer));
```

#### SQL Query

```javascript
snowflake
  .query(
    `
    SELECT id, name, ST_ASGEOJSON(geography_col) as geometry
    FROM spatial_table
    WHERE population > ?
  `,
    [1000000],
  )
  .then((features) => map.addData(features));
```

#### Spatial Functions

```sql
-- Geometry operations
SELECT ST_BUFFER(geom, 1000) FROM features;

-- Geographic operations (for GEOGRAPHY columns)
SELECT ST_DISTANCE(point1, point2) FROM locations;

-- Spatial relationships
SELECT * FROM areas
WHERE ST_CONTAINS(boundary, location);

-- Spatial joins
SELECT a.*, b.region
FROM data_a a
JOIN data_b b ON ST_INTERSECTS(a.geom, b.geom);
```

### Snowflake Column Types

- **GEOGRAPHY** - Recommended for most use cases
- **GEOMETRY** - For planar coordinates
- **VARIANT** - For GeoJSON storage

Ensure geometry columns use `ST_ASGEOJSON()` in queries.

### Performance Tips

- Use **WHERE clauses** to filter before loading
- Enable **clustering** on spatial columns
- Use **GEOGRAPHY** for lat/long data
- Set appropriate **warehouse size** for queries

## Databricks Integration

Databricks combines Apache Spark, Delta Lake, and managed infrastructure for big data + GIS.

### When to Use Databricks

- Large-scale spatial data processing
- ML/AI with geospatial features
- Real-time streaming data
- Multi-cloud flexibility
- Scala/Python development
- Organization already using Databricks

### Setup

#### Get Workspace Details

From Databricks admin:

- **Workspace URL**: `https://dbc-xxxx.cloud.databricks.com`
- **Personal Access Token**: Generate in User Settings
- **SQL Warehouse HTTP Path**: `/sql/1.0/warehouses/warehouse-id`

#### Configure Connection

```javascript
const databricks = new DatabricksConnector({
  host: "dbc-xxxx.cloud.databricks.com",
  token: "dapi...token",
  httpPath: "/sql/1.0/warehouses/warehouse-id",
});
```

### Querying Databricks

#### Load Delta Lake Table

```javascript
databricks
  .loadTable("analytics.spatial_data", {
    geometryColumn: "geom",
    useMosaicLibrary: true,
    style: { color: "purple" },
  })
  .then((layer) => map.addLayer(layer));
```

#### Spatial Query with Mosaic

```javascript
databricks
  .query(
    `
    SELECT 
      id, 
      name,
      st_geomfromtext(wkt_geom) as geometry
    FROM delta.table_name
    WHERE st_distance(st_geomfromtext(wkt_geom), 
      st_point(${lng}, ${lat})) < 1000
  `,
  )
  .then((features) => map.addData(features));
```

#### Time-Travel Query

```javascript
databricks
  .queryWithTimestamp("analytics.table_name", "2026-01-15")
  .then((features) => map.addData(features));
```

### Databricks Mosaic Library

For advanced spatial operations on Spark:

```sql
SELECT
  id,
  mosaic_geom_to_geojson(geom) as geometry
FROM features
WHERE mosaic_st_contains(boundary, geom)
```

## Apache Iceberg Integration

Apache Iceberg is an open-source table format enabling time travel and versioning.

### When to Use Iceberg

- Open-source data lake
- Version control for data
- Time-travel queries
- Organization using open standards
- Multi-engine compatibility

### Setup

#### Catalog Configuration

```javascript
const iceberg = new IcebergConnector({
  engine: "duckdb", // or "spark"
  warehousePath: "s3://my-bucket/iceberg-warehouse",
  catalogType: "hadoop", // or "hive", "rest"
});
```

#### AWS S3 Configuration

```javascript
const iceberg = new IcebergConnector({
  engine: "duckdb",
  warehousePath: "s3://my-bucket/warehouse",
  catalogType: "rest",
  catalogUri: "http://localhost:8181",
  credentials: {
    accessKeyId: "AKIA...",
    secretAccessKey: "...",
  },
});
```

### Querying Iceberg

#### Load Table

```javascript
iceberg
  .loadTable("my_catalog.my_schema.cities", {
    geometryColumn: "geom",
    style: { fillColor: "orange" },
  })
  .then((layer) => map.addLayer(layer));
```

#### Time-Travel Query

```javascript
// Query specific snapshot
iceberg
  .querySnapshot("table_name", snapshotId)
  .then((features) => map.addData(features));

// Query at specific timestamp
iceberg
  .queryAtTimestamp("table_name", "2026-01-15T10:30:00Z")
  .then((features) => map.addData(features));
```

#### Version History

```javascript
iceberg.getTableHistory("table_name").then((history) => {
  history.forEach((v) => {
    console.log(`Snapshot ${v.id}: ${v.timestamp}`);
  });
});
```

## Connection Management

### Save Connection Profiles

Save credentials for quick reconnection:

1. **Edit** → **Preferences** → **Data Warehouses**
2. **New Connection** → Choose platform
3. **Enter credentials**
4. **Save Profile**
5. Later: **Select profile** to reconnect

### Connection Security

- **Passwords**: Encrypted in local storage
- **API Tokens**: Stored securely
- **Environment Variables**: Recommended for credentials
- **No Cloud Storage**: Credentials never leave your computer

### Manage Connections

```javascript
// List saved connections
connectorManager.listConnections();

// Remove connection
connectorManager.removeConnection("profile_name");

// Test connection
connector
  .testConnection()
  .then(() => console.log("Connected!"))
  .catch((err) => console.error("Failed:", err));
```

## Querying and Filtering

### SQL Best Practices

#### Filter Early

❌ **Bad** - Load all data then filter:

```sql
SELECT * FROM large_table
```

✅ **Good** - Filter in SQL:

```sql
SELECT * FROM large_table
WHERE date >= '2026-01-01'
  AND region = 'US-West'
```

#### Limit Results

❌ **Bad** - Unbounded query:

```sql
SELECT * FROM table
```

✅ **Good** - With limit:

```sql
SELECT * FROM table LIMIT 10000
```

#### Spatial Filter

```sql
-- Load only features in bounding box
SELECT * FROM features
WHERE longitude BETWEEN -180 AND 180
  AND latitude BETWEEN -90 AND 90
```

### Common Query Patterns

#### Nearest Neighbors

```sql
SELECT name, geometry
FROM features
ORDER BY ST_Distance(geometry, ST_Point(lng, lat))
LIMIT 10
```

#### Spatial Join

```sql
SELECT a.*, b.region_name
FROM features a
JOIN regions b ON ST_Intersects(a.geometry, b.geometry)
```

#### Aggregation

```sql
SELECT region, COUNT(*) as count
FROM features
GROUP BY region
ORDER BY count DESC
```

## Performance Tips

### General Optimization

1. **Filter Early**: Use WHERE clauses to reduce data
2. **Limit Results**: Paginate large result sets
3. **Select Columns**: Only retrieve needed columns
4. **Simplify Geometries**: Use ST_SimplifyPreserveTopology for display
5. **Cache Results**: Save results locally as GeoPackage

### Platform-Specific

**DuckDB**: Enable memory mapping for large files

**Snowflake**: Use larger warehouse size for complex queries

**Databricks**: Partition tables by spatial region

**Iceberg**: Create z-order statistics on geometry columns

## Troubleshooting

### Connection Issues

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Data Warehouse section

### Query Errors

**"Column not found"**

- Check column names (case-sensitive)
- Verify schema and table names
- List table columns: `DESCRIBE table_name`

**"Geometry format error"**

- Ensure geometry columns use ST_ASGEOJSON()
- Check coordinate order (longitude, latitude)
- Verify CRS matches expectations

**"Query timeout"**

- Add WHERE clause to reduce data
- Simplify geometries
- Increase query timeout in preferences
- Break query into smaller chunks

### Performance Issues

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Performance section

---

For complete troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
