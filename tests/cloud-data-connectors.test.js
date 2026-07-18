'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createCloudDataConnector,
  SnowflakeConnector,
  DatabricksConnector,
  IcebergRestConnector,
} = require('../server-api/connectors/cloud-data');
const { rowsToGeoJSON } = require('../server-api/connectors/cloud-data/base-connector');

test('rowsToGeoJSON converts coordinates and calculates bbox', () => {
  const geojson = rowsToGeoJSON([
    { id: 1, longitude: -96.8, latitude: 32.8, name: 'Dallas' },
    { id: 2, longitude: -97.3, latitude: 32.7, name: 'Fort Worth' },
  ], { idColumn: 'id' });

  assert.equal(geojson.features.length, 2);
  assert.deepEqual(geojson.bbox, [-97.3, 32.7, -96.8, 32.8]);
  assert.equal(geojson.features[0].geometry.type, 'Point');
});

test('factory creates supported connectors', () => {
  assert.ok(createCloudDataConnector('snowflake', {
    accountUrl: 'https://example.snowflakecomputing.com', token: 'token',
  }) instanceof SnowflakeConnector);
  assert.ok(createCloudDataConnector('databricks', {
    host: 'https://example.cloud.databricks.com', token: 'token', warehouseId: 'wh',
  }) instanceof DatabricksConnector);
  assert.ok(createCloudDataConnector('iceberg', {
    baseUrl: 'https://catalog.example.com',
  }) instanceof IcebergRestConnector);
});

test('Snowflake result normalization maps row arrays to objects', () => {
  const connector = new SnowflakeConnector({
    accountUrl: 'https://example.snowflakecomputing.com', token: 'token',
  });
  const result = connector.normalizeResult({
    resultSetMetaData: { rowType: [{ name: 'ID' }, { name: 'NAME' }] },
    data: [[1, 'A']],
  });
  assert.deepEqual(result.rows, [{ ID: 1, NAME: 'A' }]);
});

test('Databricks result normalization maps data_array to objects', () => {
  const connector = new DatabricksConnector({
    host: 'https://example.cloud.databricks.com', token: 'token', warehouseId: 'wh',
  });
  const result = connector.normalizeResult({
    statement_id: 's1',
    manifest: { schema: { columns: [{ name: 'id' }, { name: 'name' }] } },
    result: { data_array: [[1, 'A']] },
  });
  assert.deepEqual(result.rows, [{ id: 1, name: 'A' }]);
});

test('Iceberg REST namespace encoding uses unit separator', async () => {
  const originalFetch = global.fetch;
  let requestedUrl = null;
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ identifiers: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    const connector = new IcebergRestConnector({ baseUrl: 'https://catalog.example.com' });
    await connector.listTables(['analytics', 'spatial']);
    assert.match(requestedUrl, /analytics%1Fspatial/);
  } finally {
    global.fetch = originalFetch;
  }
});
