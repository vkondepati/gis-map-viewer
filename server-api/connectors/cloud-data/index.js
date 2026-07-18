'use strict';

const { SnowflakeConnector } = require('./snowflake-connector');
const { DatabricksConnector } = require('./databricks-connector');
const { IcebergRestConnector } = require('./iceberg-rest-connector');

function createCloudDataConnector(type, config = {}) {
  switch (String(type || '').toLowerCase()) {
    case 'snowflake':
      return new SnowflakeConnector(config);
    case 'databricks':
      return new DatabricksConnector(config);
    case 'iceberg':
    case 'iceberg-rest':
      return new IcebergRestConnector(config);
    default:
      throw new Error(`Unsupported cloud data connector: ${type}`);
  }
}

module.exports = {
  createCloudDataConnector,
  SnowflakeConnector,
  DatabricksConnector,
  IcebergRestConnector,
};
