'use strict';

const {
  assertNonEmpty,
  normalizeBaseUrl,
  readJsonResponse,
} = require('./base-connector');

function encodeNamespace(namespace) {
  const parts = Array.isArray(namespace) ? namespace : String(namespace || '').split('.');
  const normalized = parts.map((part) => assertNonEmpty(part, 'namespace part'));
  return encodeURIComponent(normalized.join('\u001f'));
}

class IcebergRestConnector {
  constructor(config = {}) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl, 'baseUrl');
    this.prefix = String(config.prefix || '').replace(/^\/+|\/+$/g, '');
    this.token = config.token || null;
    this.headersOverride = config.headers || {};
  }

  headers() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...this.headersOverride,
    };
  }

  url(pathname) {
    const prefix = this.prefix ? `/${this.prefix}` : '';
    return `${this.baseUrl}/v1${prefix}${pathname}`;
  }

  async request(pathname, options = {}) {
    const response = await fetch(this.url(pathname), {
      ...options,
      headers: { ...this.headers(), ...(options.headers || {}) },
    });
    return readJsonResponse(response, `Iceberg REST request ${pathname}`);
  }

  async getConfig() {
    return this.request('/config');
  }

  async listNamespaces(parent = null) {
    const query = parent ? `?parent=${encodeNamespace(parent)}` : '';
    const payload = await this.request(`/namespaces${query}`);
    return payload.namespaces || [];
  }

  async loadNamespace(namespace) {
    return this.request(`/namespaces/${encodeNamespace(namespace)}`);
  }

  async listTables(namespace) {
    const payload = await this.request(`/namespaces/${encodeNamespace(namespace)}/tables`);
    return payload.identifiers || [];
  }

  async loadTable(namespace, table) {
    const tableName = encodeURIComponent(assertNonEmpty(table, 'table'));
    return this.request(`/namespaces/${encodeNamespace(namespace)}/tables/${tableName}`);
  }

  async tableMetadata(namespace, table) {
    const loaded = await this.loadTable(namespace, table);
    return {
      metadataLocation: loaded['metadata-location'] || loaded.metadataLocation || null,
      metadata: loaded.metadata || null,
      config: loaded.config || {},
    };
  }
}

module.exports = { IcebergRestConnector, encodeNamespace };
