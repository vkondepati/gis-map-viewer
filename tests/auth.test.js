const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createPasswordHash,
  verifyPassword,
  createLocalUser,
  authenticateLocalUser,
  upsertOAuthUser,
  sanitizeUser,
} = require('../server-api/auth');

test('password hashing verifies valid password and rejects invalid password', () => {
  const hash = createPasswordHash('secret-pass-123');
  assert.equal(verifyPassword('secret-pass-123', hash), true);
  assert.equal(verifyPassword('wrong-pass', hash), false);
});

test('createLocalUser stores normalized local user and authenticateLocalUser resolves it', () => {
  const store = { users: [] };
  const user = createLocalUser(store, {
    name: '  Test User  ',
    username: 'Test.User',
    email: 'USER@Example.com ',
    password: 'password-123',
  });
  assert.equal(user.email, 'user@example.com');
  assert.equal(user.username, 'test.user');
  const authenticated = authenticateLocalUser(store, 'test.user', 'password-123');
  assert.equal(authenticated.id, user.id);
  const publicUser = sanitizeUser(authenticated);
  assert.equal(publicUser.passwordHash, undefined);
});

test('upsertOAuthUser creates and later updates OAuth-backed users', () => {
  const store = { users: [] };
  const created = upsertOAuthUser(store, {
    provider: 'google',
    providerUserId: 'abc123',
    email: 'person@example.com',
    name: 'Person One',
    avatarUrl: 'https://example.com/avatar.png',
  });
  assert.equal(created.authProvider, 'google');
  assert.equal(store.users.length, 1);

  const updated = upsertOAuthUser(store, {
    provider: 'google',
    providerUserId: 'abc123',
    email: 'person@example.com',
    name: 'Person Updated',
  });
  assert.equal(updated.id, created.id);
  assert.equal(updated.name, 'Person Updated');
});
