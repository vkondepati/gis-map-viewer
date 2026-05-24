const test = require('node:test');
const assert = require('node:assert/strict');

const { getApiBaseUrl } = require('../shared/platform/web-platform');

test('getApiBaseUrl falls back to /api', () => {
  global.__NEXAMAP_WEB_CONFIG__ = undefined;
  assert.equal(getApiBaseUrl(), '/api');
});
