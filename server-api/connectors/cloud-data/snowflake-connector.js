'use strict';

const {
  assertNonEmpty,
  normalizeBaseUrl,
  readJsonResponse,
  rowsToGeoJSON,
} = require('./base-connector');

class SnowflakeConnector {
  constructor(config = {}) {
    this.accountUrl = normalizeBaseUrl(config.accountUrl, 'accountUrl');
    this.token = assertNonEmpty(config.token, 'token');
    this.database = config.database || null;
    this.schema = config.schema || null;
    this.warehouse = config.warehouse || null;
    this.role = config.role || null;
    this.tokenType = config.tokenType || 'KEYPAIR_JWT';
  }

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Snowflake-Authorization-Token-Type': this.tokenType,
    };
  }

  async execute(sql, options = {}) {
    const statement = assertNonEmpty(sql, 'sql');
    const response = await fetch(`${this.accountUrl}/api/v2/statements`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        statement,
        timeout: options.timeoutSeconds || 60,
        database: options.database || this.database || undefined,
        schema: options.schema || this.schema || undefined,
        warehouse: options.warehouse || this.warehouse || undefined,
        role: options.role || this.role || undefined,
      }),
    });
    const payload = await readJsonResponse(response, 'Snowflake statement');
    if (payload.statementHandle && !payload.data) {
      return this.poll(payload.statementHandle, options);
    }
    return this.normalizeResult(payload);
  }

  async poll(statementHandle, options = {}) {
    const intervalMs = options.pollIntervalMs || 500;
    const deadline = Date.now() + (options.timeoutSeconds || 60) * 1000;
    while (Date.now() < deadline) {
      const response = await fetch(`${this.accountUrl}/api/v2/statements/${encodeURIComponent(statementHandle)}`, {
        headers: this.headers(),
      });
      if (response.status === 202) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }
      return this.normalizeResult(await readJsonResponse(response, 'Snowflake statement polling'));
    }
    throw new Error('Snowflake statement timed out.');
  }

  normalizeResult(payload = {}) {
    const columns = (payload.resultSetMetaData && payload.resultSetMetaData.rowType) || [];
    const names = columns.map((column) => column.name);
    const rows = (payload.data || []).map((values) => Object.fromEntries(names.map((name, index) => [name, values[index]])));
    return {
      rows,
      columns,
      statementHandle: payload.statementHandle || null,
      rowCount: rows.length,
    };
  }

  async listTables() {
    const result = await this.execute('SHOW TERSE TABLES');
    return result.rows;
  }

  async queryGeoJSON(sql, geoOptions = {}, executeOptions = {}) {
    const result = await this.execute(sql, executeOptions);
    return rowsToGeoJSON(result.rows, geoOptions);
  }
}

module.exports = { SnowflakeConnector };
