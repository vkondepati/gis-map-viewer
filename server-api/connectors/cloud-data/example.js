'use strict';

const { createCloudDataConnector } = require('./index');

async function run() {
  const provider = String(process.env.NEXAMAP_CLOUD_PROVIDER || '').toLowerCase();
  let connector;

  if (provider === 'snowflake') {
    connector = createCloudDataConnector('snowflake', {
      accountUrl: process.env.SNOWFLAKE_ACCOUNT_URL,
      token: process.env.SNOWFLAKE_TOKEN,
      tokenType: process.env.SNOWFLAKE_TOKEN_TYPE || 'KEYPAIR_JWT',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      role: process.env.SNOWFLAKE_ROLE,
    });
    console.log(await connector.listTables());
    return;
  }

  if (provider === 'databricks') {
    connector = createCloudDataConnector('databricks', {
      host: process.env.DATABRICKS_HOST,
      token: process.env.DATABRICKS_TOKEN,
      warehouseId: process.env.DATABRICKS_WAREHOUSE_ID,
      catalog: process.env.DATABRICKS_CATALOG,
      schema: process.env.DATABRICKS_SCHEMA,
    });
    console.log(await connector.listTables());
    return;
  }

  if (provider === 'iceberg') {
    connector = createCloudDataConnector('iceberg', {
      baseUrl: process.env.ICEBERG_CATALOG_URL,
      prefix: process.env.ICEBERG_CATALOG_PREFIX,
      token: process.env.ICEBERG_CATALOG_TOKEN,
    });
    console.log(await connector.listNamespaces());
    return;
  }

  throw new Error('Set NEXAMAP_CLOUD_PROVIDER to snowflake, databricks, or iceberg.');
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
