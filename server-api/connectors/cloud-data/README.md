# NexaMap Cloud Data Connectors

This module provides dependency-free Node.js connectors for Snowflake, Databricks SQL Warehouses, and Apache Iceberg REST catalogs. The connectors use the built-in `fetch` API available in Node.js 18 and later.

Credentials must stay in the server process. Do not expose access tokens to the browser or commit them to source control.

## Factory

```js
const { createCloudDataConnector } = require('./connectors/cloud-data');
```

## Snowflake

The Snowflake connector uses the Snowflake SQL API.

```js
const snowflake = createCloudDataConnector('snowflake', {
  accountUrl: process.env.SNOWFLAKE_ACCOUNT_URL,
  token: process.env.SNOWFLAKE_TOKEN,
  tokenType: 'KEYPAIR_JWT', // or OAUTH
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  role: process.env.SNOWFLAKE_ROLE,
});

const result = await snowflake.execute('SELECT * FROM LOCATIONS LIMIT 100');
const geojson = await snowflake.queryGeoJSON(
  'SELECT ID, NAME, LONGITUDE, LATITUDE FROM LOCATIONS LIMIT 100',
  { idColumn: 'ID', longitudeColumn: 'LONGITUDE', latitudeColumn: 'LATITUDE' },
);
```

The token can be an OAuth access token or a key-pair JWT, depending on `tokenType`.

## Databricks

The Databricks connector uses the Statement Execution API for a SQL warehouse.

```js
const databricks = createCloudDataConnector('databricks', {
  host: process.env.DATABRICKS_HOST,
  token: process.env.DATABRICKS_TOKEN,
  warehouseId: process.env.DATABRICKS_WAREHOUSE_ID,
  catalog: process.env.DATABRICKS_CATALOG,
  schema: process.env.DATABRICKS_SCHEMA,
});

const result = await databricks.execute('SELECT * FROM spatial.locations LIMIT 100');
const geojson = await databricks.queryGeoJSON(
  'SELECT id, name, longitude, latitude FROM spatial.locations LIMIT 100',
  { idColumn: 'id' },
);
```

## Apache Iceberg

The Iceberg connector implements catalog discovery through the Iceberg REST Catalog API.

```js
const iceberg = createCloudDataConnector('iceberg', {
  baseUrl: process.env.ICEBERG_CATALOG_URL,
  prefix: process.env.ICEBERG_CATALOG_PREFIX,
  token: process.env.ICEBERG_CATALOG_TOKEN,
});

const namespaces = await iceberg.listNamespaces();
const tables = await iceberg.listTables(['analytics', 'spatial']);
const table = await iceberg.tableMetadata(['analytics', 'spatial'], 'locations');
```

The REST catalog returns table metadata and metadata locations. Reading Parquet data files is intentionally left to a query engine such as Snowflake, Databricks, Trino, DuckDB, or Spark.

## GeoJSON conversion

`queryGeoJSON()` supports:

- GeoJSON geometry objects or JSON strings through `geometryColumn`
- Longitude and latitude columns through `longitudeColumn` and `latitudeColumn`
- Optional feature IDs through `idColumn`
- Automatic FeatureCollection bounding-box calculation

Example:

```js
const geojson = await connector.queryGeoJSON(sql, {
  geometryColumn: 'geometry',
  longitudeColumn: 'longitude',
  latitudeColumn: 'latitude',
  idColumn: 'id',
});
```

## Run tests

From the repository root:

```bash
npm test
```
