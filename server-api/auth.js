const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_USER_STORE = path.join(__dirname, 'data', 'users.json');

function ensureUserStoreDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function loadUserStore(filePath = DEFAULT_USER_STORE) {
  ensureUserStoreDirectory(filePath);
  if (!fs.existsSync(filePath)) {
    return { users: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed || !Array.isArray(parsed.users)) return { users: [] };
    return { users: parsed.users };
  } catch (_err) {
    return { users: [] };
  }
}

function saveUserStore(store, filePath = DEFAULT_USER_STORE) {
  ensureUserStoreDirectory(filePath);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const value = String(storedHash || '');
  const parts = value.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHash] = parts;
  const actualHash = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username || null,
    email: user.email,
    authProvider: user.authProvider || 'local',
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt || null,
    lastLoginAt: user.lastLoginAt || null,
  };
}

function validateLocalCredentials({ name, username, email, password }) {
  const normalizedName = normalizeName(name);
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');
  if (!normalizedName || normalizedName.length < 2) {
    throw new Error('Name must be at least 2 characters.');
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
    throw new Error('Username must be 3-30 characters and use letters, numbers, dot, underscore, or hyphen.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid email address is required.');
  }
  if (normalizedPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  return {
    name: normalizedName,
    username: normalizedUsername,
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

function createLocalUser(store, payload) {
  const { name, username, email, password } = validateLocalCredentials(payload || {});
  if ((store.users || []).some((user) => normalizeEmail(user.email) === email)) {
    throw new Error('An account with that email already exists.');
  }
  if ((store.users || []).some((user) => normalizeUsername(user.username) === username)) {
    throw new Error('That username is already taken.');
  }
  const createdAt = new Date().toISOString();
  const user = {
    id: generateId('usr'),
    name,
    username,
    email,
    passwordHash: createPasswordHash(password),
    authProvider: 'local',
    avatarUrl: null,
    createdAt,
    lastLoginAt: createdAt,
  };
  store.users.push(user);
  return user;
}

function authenticateLocalUser(store, identifier, password) {
  const normalizedEmailIdentifier = normalizeEmail(identifier);
  const normalizedUsernameIdentifier = normalizeUsername(identifier);
  const user = (store.users || []).find((entry) => (
    normalizeEmail(entry.email) === normalizedEmailIdentifier
      || normalizeUsername(entry.username) === normalizedUsernameIdentifier
  ));
  if (!user || user.authProvider !== 'local') {
    throw new Error('Invalid email or password.');
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  user.lastLoginAt = new Date().toISOString();
  return user;
}

function upsertOAuthUser(store, payload) {
  const provider = String(payload && payload.provider || '').trim().toLowerCase();
  const providerUserId = String(payload && payload.providerUserId || '').trim();
  const email = normalizeEmail(payload && payload.email);
  const name = normalizeName(payload && payload.name) || email || providerUserId;
  if (!provider || !providerUserId) {
    throw new Error('OAuth user identity is incomplete.');
  }

  let user = (store.users || []).find((entry) => (
    String(entry.authProvider || '').toLowerCase() === provider
      && String(entry.providerUserId || '') === providerUserId
  ));

  if (!user && email) {
    user = (store.users || []).find((entry) => normalizeEmail(entry.email) === email);
  }

  const now = new Date().toISOString();
  if (!user) {
    user = {
      id: generateId('usr'),
      name,
      username: email ? email.split('@')[0].slice(0, 30).toLowerCase() : null,
      email,
      passwordHash: null,
      authProvider: provider,
      providerUserId,
      avatarUrl: payload && payload.avatarUrl ? String(payload.avatarUrl) : null,
      createdAt: now,
      lastLoginAt: now,
    };
    store.users.push(user);
    return user;
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.authProvider = provider;
  user.providerUserId = providerUserId;
  user.avatarUrl = payload && payload.avatarUrl ? String(payload.avatarUrl) : user.avatarUrl || null;
  user.lastLoginAt = now;
  return user;
}

module.exports = {
  DEFAULT_USER_STORE,
  loadUserStore,
  saveUserStore,
  normalizeEmail,
  createPasswordHash,
  verifyPassword,
  sanitizeUser,
  createLocalUser,
  authenticateLocalUser,
  upsertOAuthUser,
};
