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

test('createLocalUser rejects duplicate email and duplicate username', () => {
  const store = { users: [] };
  createLocalUser(store, {
    name: 'First User',
    username: 'first-user',
    email: 'first@example.com',
    password: 'password-123',
  });

  assert.throws(() => {
    createLocalUser(store, {
      name: 'Second User',
      username: 'second-user',
      email: 'FIRST@example.com',
      password: 'password-123',
    });
  }, /email already exists/i);

  assert.throws(() => {
    createLocalUser(store, {
      name: 'Third User',
      username: 'FIRST-USER',
      email: 'third@example.com',
      password: 'password-123',
    });
  }, /username is already taken/i);
});

test('authenticateLocalUser accepts email and rejects invalid passwords', () => {
  const store = { users: [] };
  const user = createLocalUser(store, {
    name: 'Email Login User',
    username: 'email-login',
    email: 'login@example.com',
    password: 'password-123',
  });

  const authenticated = authenticateLocalUser(store, 'LOGIN@example.com', 'password-123');
  assert.equal(authenticated.id, user.id);

  assert.throws(() => {
    authenticateLocalUser(store, 'login@example.com', 'wrong-password');
  }, /invalid email or password/i);
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

test('upsertOAuthUser reuses an existing local user when email matches', () => {
  const store = { users: [] };
  const localUser = createLocalUser(store, {
    name: 'Existing User',
    username: 'existing-user',
    email: 'existing@example.com',
    password: 'password-123',
  });

  const oauthUser = upsertOAuthUser(store, {
    provider: 'google',
    providerUserId: 'google-123',
    email: 'existing@example.com',
    name: 'Existing User From Google',
  });

  assert.equal(store.users.length, 1);
  assert.equal(oauthUser.id, localUser.id);
  assert.equal(oauthUser.authProvider, 'google');
  assert.equal(oauthUser.providerUserId, 'google-123');
});
