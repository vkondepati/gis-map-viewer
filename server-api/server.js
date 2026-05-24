const http = require('node:http');
const crypto = require('node:crypto');
const {
  loadUserStore,
  saveUserStore,
  sanitizeUser,
  createLocalUser,
  authenticateLocalUser,
  upsertOAuthUser,
} = require('./auth');

const PORT = Number(process.env.PORT || 8787);
const SESSION_COOKIE_NAME = 'nexamap_session';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_CLEANUP_MS = 60 * 60 * 1000;
const sessions = new Map();
const pendingOAuthStates = new Map();
const userStore = loadUserStore(process.env.AUTH_USERS_FILE);

function trimText(input, maxLength = 1200) {
  const normalized = String(input || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function extractResponseText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  if (!Array.isArray(payload.output)) return '';
  const out = [];
  payload.output.forEach((item) => {
    if (!item || !Array.isArray(item.content)) return;
    item.content.forEach((part) => {
      if (!part || typeof part !== 'object') return;
      if (typeof part.text === 'string' && part.text.trim()) out.push(part.text.trim());
      if (typeof part.output_text === 'string' && part.output_text.trim()) out.push(part.output_text.trim());
    });
  });
  return out.join('\n').trim();
}

async function callOpenAIMapAssistant(question, mapContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY is not configured in environment variables.' };
  const model = /^[a-zA-Z0-9._:-]{1,80}$/.test(process.env.OPENAI_MODEL || '')
    ? process.env.OPENAI_MODEL
    : 'gpt-4o-mini';
  const sanitizedQuestion = trimText(question, 1500);
  const contextString = trimText(JSON.stringify(mapContext || {}, null, 2), 24000);
  const systemPrompt = [
    'You are a GIS assistant for a web map application.',
    'Answer only from provided map context and user question.',
    'If context is insufficient, clearly say what is missing.',
    'Keep answers concise and practical.',
  ].join(' ');
  const userPrompt = `User question:\n${sanitizedQuestion}\n\nMap context JSON:\n${contextString}`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
      ],
      temperature: 0.2,
      max_output_tokens: 650,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    const errMsg = payload && payload.error && payload.error.message
      ? payload.error.message
      : `OpenAI request failed with status ${response.status}`;
    return { ok: false, error: errMsg };
  }
  const text = extractResponseText(payload);
  if (!text) return { ok: false, error: 'Assistant returned an empty response.' };
  return { ok: true, answer: text };
}

function getBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? String(forwardedProto).split(',')[0].trim() : 'http';
  return `${protocol}://${req.headers.host || `localhost:${PORT}`}`;
}

function resolvePublicBaseUrl(req) {
  const explicit = String(process.env.AUTH_PUBLIC_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const origin = String(req.headers.origin || '').trim();
  if (origin) return origin.replace(/\/+$/, '');
  const referer = String(req.headers.referer || '').trim();
  if (referer) {
    try {
      const parsed = new URL(referer);
      return parsed.origin.replace(/\/+$/, '');
    } catch (_err) {
      // Fall through to backend base URL.
    }
  }
  return getBaseUrl(req);
}

function parseCookies(req) {
  const header = String(req.headers.cookie || '');
  return header.split(';').reduce((acc, part) => {
    const [rawName, ...rest] = part.trim().split('=');
    if (!rawName) return acc;
    acc[rawName] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function buildSetCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.maxAge != null) parts.push(`Max-Age=${Math.max(0, Number(options.maxAge) || 0)}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

function getCorsHeaders(req) {
  const origin = req.headers.origin;
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function sendJson(req, res, statusCode, body, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCorsHeaders(req),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function sendRedirect(req, res, location, cookieHeaders = []) {
  const headers = {
    Location: location,
    ...getCorsHeaders(req),
  };
  if (cookieHeaders.length) headers['Set-Cookie'] = cookieHeaders;
  res.writeHead(302, headers);
  res.end();
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function persistUsers() {
  saveUserStore(userStore, process.env.AUTH_USERS_FILE);
}

function createSession(user) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  sessions.set(sessionId, {
    id: sessionId,
    userId: user.id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return sessionId;
}

function clearExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (!session || session.expiresAt <= now) sessions.delete(sessionId);
  }
  for (const [state, payload] of pendingOAuthStates.entries()) {
    if (!payload || payload.expiresAt <= now) pendingOAuthStates.delete(state);
  }
}

setInterval(clearExpiredSessions, SESSION_CLEANUP_MS).unref();

function getAuthenticatedUser(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return userStore.users.find((user) => user.id === session.userId) || null;
}

function getOAuthProviderConfigs(req) {
  const publicBaseUrl = resolvePublicBaseUrl(req);
  return {
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${publicBaseUrl}/api/auth/oauth/google/callback`,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
      scopes: ['openid', 'email', 'profile'],
    },
    linkedin: {
      enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${publicBaseUrl}/api/auth/oauth/linkedin/callback`,
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
      scopes: ['openid', 'profile', 'email'],
    },
  };
}

function getPostLoginRedirect(req) {
  return process.env.AUTH_POST_LOGIN_REDIRECT || `${resolvePublicBaseUrl(req)}/web-app/`;
}

async function exchangeOAuthCode(providerConfig, code, redirectUri) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: providerConfig.clientId,
    client_secret: providerConfig.clientSecret,
  });
  const response = await fetch(providerConfig.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'OAuth token exchange failed.');
  }
  return payload;
}

async function fetchOAuthUserProfile(providerName, providerConfig, tokenPayload) {
  const accessToken = tokenPayload.access_token;
  if (!accessToken) throw new Error('OAuth provider did not return an access token.');
  const response = await fetch(providerConfig.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const profile = await response.json();
  if (!response.ok) {
    throw new Error(profile.error_description || profile.message || 'Failed to fetch OAuth user profile.');
  }
  if (providerName === 'google') {
    return {
      providerUserId: String(profile.sub || ''),
      email: String(profile.email || ''),
      name: String(profile.name || profile.email || ''),
      avatarUrl: profile.picture ? String(profile.picture) : null,
    };
  }
  return {
    providerUserId: String(profile.sub || profile.id || ''),
    email: String(profile.email || ''),
    name: String(profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || profile.email || ''),
    avatarUrl: profile.picture ? String(profile.picture) : null,
  };
}

async function handleRegister(req, res) {
  try {
    const payload = await readJsonBody(req);
    const user = createLocalUser(userStore, payload);
    persistUsers();
    const sessionId = createSession(user);
    sendJson(req, res, 200, { ok: true, user: sanitizeUser(user) }, {
      'Set-Cookie': buildSetCookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: SESSION_TTL_MS / 1000,
      }),
    });
  } catch (err) {
    sendJson(req, res, 400, { ok: false, error: err && err.message ? err.message : 'Registration failed.' });
  }
}

async function handleLogin(req, res) {
  try {
    const payload = await readJsonBody(req);
    const user = authenticateLocalUser(userStore, payload.identifier || payload.email, payload.password);
    persistUsers();
    const sessionId = createSession(user);
    sendJson(req, res, 200, { ok: true, user: sanitizeUser(user) }, {
      'Set-Cookie': buildSetCookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: SESSION_TTL_MS / 1000,
      }),
    });
  } catch (err) {
    sendJson(req, res, 401, { ok: false, error: err && err.message ? err.message : 'Login failed.' });
  }
}

function handleLogout(req, res) {
  const cookies = parseCookies(req);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (sessionId) sessions.delete(sessionId);
  sendJson(req, res, 200, { ok: true }, {
    'Set-Cookie': buildSetCookie(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 0,
    }),
  });
}

function handleAuthSession(req, res) {
  const user = getAuthenticatedUser(req);
  sendJson(req, res, 200, { ok: true, authenticated: !!user, user: sanitizeUser(user) });
}

function handleAuthProviders(req, res) {
  const providers = getOAuthProviderConfigs(req);
  sendJson(req, res, 200, {
    ok: true,
    providers: {
      google: { enabled: providers.google.enabled, label: 'Google' },
      linkedin: { enabled: providers.linkedin.enabled, label: 'LinkedIn' },
      local: { enabled: true, label: 'Email and Password' },
    },
  });
}

function handleOAuthStart(req, res, providerName) {
  const providerConfig = getOAuthProviderConfigs(req)[providerName];
  if (!providerConfig || !providerConfig.enabled) {
    sendJson(req, res, 400, { ok: false, error: `${providerName} sign-in is not configured.` });
    return;
  }
  const state = crypto.randomBytes(18).toString('hex');
  pendingOAuthStates.set(state, {
    providerName,
    redirectUri: providerConfig.redirectUri,
    publicBaseUrl: resolvePublicBaseUrl(req),
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
  });
  const authUrl = new URL(providerConfig.authUrl);
  authUrl.searchParams.set('client_id', providerConfig.clientId);
  authUrl.searchParams.set('redirect_uri', providerConfig.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', providerConfig.scopes.join(' '));
  authUrl.searchParams.set('state', state);
  if (providerName === 'google') {
    authUrl.searchParams.set('access_type', 'online');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('prompt', 'select_account');
  }
  sendRedirect(req, res, authUrl.toString());
}

async function handleOAuthCallback(req, res, providerName, url) {
  const code = String(url.searchParams.get('code') || '');
  const state = String(url.searchParams.get('state') || '');
  const error = String(url.searchParams.get('error') || '');
  const statePayload = pendingOAuthStates.get(state);
  const redirectBase = new URL(process.env.AUTH_POST_LOGIN_REDIRECT || `${statePayload && statePayload.publicBaseUrl ? statePayload.publicBaseUrl : resolvePublicBaseUrl(req)}/web-app/`);
  if (error) {
    redirectBase.searchParams.set('authError', error);
    sendRedirect(req, res, redirectBase.toString());
    return;
  }
  pendingOAuthStates.delete(state);
  if (!code || !statePayload || statePayload.providerName !== providerName || statePayload.expiresAt <= Date.now()) {
    redirectBase.searchParams.set('authError', 'invalid_state');
    sendRedirect(req, res, redirectBase.toString());
    return;
  }
  const providerConfig = getOAuthProviderConfigs(req)[providerName];
  if (!providerConfig || !providerConfig.enabled) {
    redirectBase.searchParams.set('authError', 'provider_not_configured');
    sendRedirect(req, res, redirectBase.toString());
    return;
  }
  try {
    const tokenPayload = await exchangeOAuthCode(providerConfig, code, statePayload.redirectUri || providerConfig.redirectUri);
    const oauthUser = await fetchOAuthUserProfile(providerName, providerConfig, tokenPayload);
    const user = upsertOAuthUser(userStore, { provider: providerName, ...oauthUser });
    persistUsers();
    const sessionId = createSession(user);
    redirectBase.searchParams.set('authSuccess', providerName);
    sendRedirect(req, res, redirectBase.toString(), [
      buildSetCookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: 'Lax',
        maxAge: SESSION_TTL_MS / 1000,
      }),
    ]);
  } catch (err) {
    redirectBase.searchParams.set('authError', err && err.message ? err.message : 'oauth_failed');
    sendRedirect(req, res, redirectBase.toString());
  }
}

const server = http.createServer(async (req, res) => {
  clearExpiredSessions();
  const url = new URL(req.url, getBaseUrl(req));
  if (req.method === 'OPTIONS') {
    sendJson(req, res, 204, {});
    return;
  }
  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(req, res, 200, { ok: true, service: 'nexamap-server-api' });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/providers') {
    handleAuthProviders(req, res);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    handleAuthSession(req, res);
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    await handleRegister(req, res);
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    await handleLogin(req, res);
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    handleLogout(req, res);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/oauth/google/start') {
    handleOAuthStart(req, res, 'google');
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/oauth/linkedin/start') {
    handleOAuthStart(req, res, 'linkedin');
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/oauth/google/callback') {
    await handleOAuthCallback(req, res, 'google', url);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/oauth/linkedin/callback') {
    await handleOAuthCallback(req, res, 'linkedin', url);
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/map-assistant') {
    try {
      const payload = await readJsonBody(req);
      const question = String(payload.question || '').trim();
      if (!question) {
        sendJson(req, res, 400, { ok: false, error: 'Question is required.' });
        return;
      }
      const result = await callOpenAIMapAssistant(question, payload.mapContext || {});
      sendJson(req, res, result.ok ? 200 : 500, result);
    } catch (err) {
      sendJson(req, res, 500, { ok: false, error: err && err.message ? err.message : 'Request failed.' });
    }
    return;
  }
  sendJson(req, res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`NexaMap server API listening on http://localhost:${PORT}`);
});
