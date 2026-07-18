'use strict';

const {
  assertNonEmpty,
  normalizeBaseUrl,
  readJsonResponse,
  rowsToGeoJSON,
} = require('./base-connector');

class DatabricksConnector {
  constructor(config = {}) {
    this.host = normalizeBaseUrl(config.host, 'host');
    this.token = assertNonEmpty(config.token, 'token');
    this.warehouseId = assertNonEmpty(config.warehouseId, 'warehouseId');
    this.catalog = config.catalog || null;
    this.schema = config.schema || null;
  }

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async execute(sql, options = {}) {
    const response = await fetch(`${this.host}/api/2.0/sql/statements`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        statement: assertNonEmpty(sql, 'sql'),
        warehouse_id: this.warehouseId,
        catalog: options.catalog || this.catalog || undefined,
        schema: options.schema || this.schema || undefined,
        wait_timeout: options.waitTimeout || '10s',
        on_wait_timeout: 'CONTINUE',
        disposition: 'INLINE',
        format: 'JSON_ARRAY',
      }),
    });
    const payload = await readJsonResponse(response, 'Databricks statement');
    const state = payload.status && payload.status.state;
    if (state && !['SUCCEEDED', 'FAILED', 'CANCELED', 'CLOSED'].includes(state)) {
      return this.poll(payload.statement_id, options);
    }
    return this.normalizeResult(payload);
  }

  async poll(statementId, options = {}) {
    const intervalMs = options.pollIntervalMs || 500;
    const deadline = Date.now() + (options.timeoutSeconds || 60) * 1000;
    while (Date.now() < deadline) {
      const response = await fetch(`${this.host}/api/2.0/sql/statements/${encodeURIComponent(statementId)}`, {
        headers: this.headers(),
      });
      const payload = await readJsonResponse(response, 'Databricks statement polling');
      const state = payload.status && payload.status.state;
      if (state === 'SUCCEEDED') return this.normalizeResult(payload);
      if (['FAILED', 'CANCELED', 'CLOSED'].includes(state)) {
        const message = payload.status && payload.status.error && payload.status.error.message;
        throw new Error(message || `Databricks statement ended in state ${state}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Databricks statement timed out.');
  }

  normalizeResult(payload = {}) {
    const columns = (payload.manifest && payload.manifest.schema && payload.manifest.schema.columns) || [];
    const names = columns.map((column) => column.name);
    const values = (payload.result && payload.result.data_array) || [];
    const rows = values.map((row) => Object.fromEntries(names.map((name, index) => [name, row[index]])));
    return {
      rows,
      columns,
      statementId: payload.statement_id || null,
      rowCount: rows.length,
    };
  }

  async listTables() {
    const result = await this.execute('SHOW TABLES');
    return result.rows;
  }

  async queryGeoJSON(sql, geoOptions = {}, executeOptions = {}) {
    const result = await this.execute(sql, executeOptions);
    return rowsToGeoJSON(result.rows, geoOptions);
  }
}

module.exports = { DatabricksConnector };
