const test = require('node:test');
const assert = require('node:assert/strict');

const { getApiBaseUrl, createWebPlatform } = require('../shared/platform/web-platform');

test('getApiBaseUrl falls back to /api', () => {
  global.__NEXAMAP_WEB_CONFIG__ = undefined;
  assert.equal(getApiBaseUrl(), '/api');
});

test('getApiBaseUrl trims trailing slash from configured value', () => {
  global.__NEXAMAP_WEB_CONFIG__ = { apiBaseUrl: '/custom-api/' };
  assert.equal(getApiBaseUrl(), '/custom-api');
});

test('createWebPlatform dispatches menu actions to registered listeners', async () => {
  const calls = [];
  const errors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(' '));
  };

  try {
    const platform = createWebPlatform();
    platform.onMenuAction((payload) => {
      calls.push(`first:${payload.action}`);
    });
    platform.onMenuAction(async (payload) => {
      calls.push(`second:${payload.action}`);
    });
    platform.triggerMenuAction({ action: 'save-project' });
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(calls, ['first:save-project', 'second:save-project']);
    assert.equal(errors.length, 0);
  } finally {
    console.error = originalConsoleError;
  }
});
