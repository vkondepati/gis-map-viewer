(function initNexaMapWebAuth(globalScope) {
  const root = globalScope || window;

  function getApiBaseUrl() {
    const config = root.__NEXAMAP_WEB_CONFIG__ || {};
    return String(config.apiBaseUrl || '/api').replace(/\/+$/, '');
  }

  function byId(id) {
    return document.getElementById(id);
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) {
      const rawError = payload && payload.error ? String(payload.error) : 'Request failed.';
      if (rawError === 'Not found' && String(path || '').startsWith('/auth/')) {
        throw new Error('Auth API is unavailable. Restart `npm run api` so the latest server routes are loaded.');
      }
      throw new Error(rawError);
    }
    return payload;
  }

  const authState = {
    user: null,
    providers: {
      local: { enabled: true, label: 'Email and Password' },
      google: { enabled: false, label: 'Google' },
      linkedin: { enabled: false, label: 'LinkedIn' },
    },
  };

  function setAuthMessage(text, isError = false) {
    const el = byId('auth-message');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('error', !!(text && isError));
    el.classList.toggle('success', !!(text && !isError));
  }

  function renderProviderButtons() {
    const googleBtn = byId('auth-google-btn');
    const linkedinBtn = byId('auth-linkedin-btn');
    if (googleBtn) {
      googleBtn.disabled = !authState.providers.google.enabled;
      googleBtn.title = authState.providers.google.enabled ? 'Sign in with Google' : 'Google sign-in is not configured on the server';
    }
    if (linkedinBtn) {
      linkedinBtn.disabled = !authState.providers.linkedin.enabled;
      linkedinBtn.title = authState.providers.linkedin.enabled ? 'Sign in with LinkedIn' : 'LinkedIn sign-in is not configured on the server';
    }
  }

  function renderAuthState() {
    const loggedOut = byId('auth-logged-out');
    const loggedIn = byId('auth-logged-in');
    const nameEl = byId('auth-user-name');
    const emailEl = byId('auth-user-email');
    const avatarEl = byId('auth-user-avatar');
    const user = authState.user;
    if (loggedOut) loggedOut.style.display = user ? 'none' : 'flex';
    if (loggedIn) loggedIn.style.display = user ? 'flex' : 'none';
    if (nameEl) nameEl.textContent = user ? user.name : '';
    if (emailEl) emailEl.textContent = user ? user.email : '';
    if (avatarEl) {
      if (user && user.avatarUrl) {
        avatarEl.src = user.avatarUrl;
        avatarEl.style.display = 'block';
      } else {
        avatarEl.removeAttribute('src');
        avatarEl.style.display = 'none';
      }
    }
  }

  function setAuthMode(mode) {
    const normalized = mode === 'register' ? 'register' : 'login';
    document.body.dataset.authMode = normalized;
    const title = byId('auth-dialog-title');
    const submit = byId('auth-submit-btn');
    const switchBtn = byId('auth-switch-mode-btn');
    const nameRow = byId('auth-name-row');
    const usernameRow = byId('auth-username-row');
    const emailLabel = byId('auth-email-label');
    if (title) title.textContent = normalized === 'register' ? 'Create Account' : 'Sign In';
    if (submit) submit.textContent = normalized === 'register' ? 'Register' : 'Sign In';
    if (switchBtn) switchBtn.textContent = normalized === 'register' ? 'Have an account? Sign in' : 'Need an account? Register';
    if (nameRow) nameRow.style.display = normalized === 'register' ? 'block' : 'none';
    if (usernameRow) usernameRow.style.display = normalized === 'register' ? 'block' : 'none';
    if (emailLabel) emailLabel.textContent = normalized === 'register' ? 'Email:' : 'Email or Username:';
    setAuthMessage('');
  }

  function showAuthDialog(mode = 'login') {
    setAuthMode(mode);
    const overlay = byId('modal-overlay');
    const dialog = byId('dialog-auth');
    if (!overlay || !dialog) return;
    overlay.classList.add('visible');
    dialog.classList.add('visible');
    dialog.classList.remove('modal-hidden');
  }

  function hideAuthDialog() {
    const overlay = byId('modal-overlay');
    const dialog = byId('dialog-auth');
    if (!overlay || !dialog) return;
    overlay.classList.remove('visible');
    dialog.classList.remove('visible');
    dialog.classList.add('modal-hidden');
    setAuthMessage('');
  }

  async function refreshProviders() {
    try {
      const payload = await requestJson('/auth/providers', { method: 'GET' });
      authState.providers = payload.providers || authState.providers;
    } catch (_err) {
      authState.providers = {
        ...authState.providers,
        google: { ...authState.providers.google, enabled: false },
        linkedin: { ...authState.providers.linkedin, enabled: false },
      };
    }
    renderProviderButtons();
  }

  async function refreshSession() {
    try {
      const payload = await requestJson('/auth/session', { method: 'GET' });
      authState.user = payload.user || null;
    } catch (_err) {
      authState.user = null;
    }
    renderAuthState();
  }

  async function submitAuthForm() {
    const mode = document.body.dataset.authMode === 'register' ? 'register' : 'login';
    const name = byId('auth-name-input') ? byId('auth-name-input').value : '';
    const username = byId('auth-username-input') ? byId('auth-username-input').value : '';
    const email = byId('auth-email-input') ? byId('auth-email-input').value : '';
    const password = byId('auth-password-input') ? byId('auth-password-input').value : '';
    setAuthMessage('');
    try {
      if (mode === 'register') {
        await requestJson('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, username, email, password }),
        });
      } else {
        await requestJson('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: email, password }),
        });
      }
      await refreshSession();
      hideAuthDialog();
    } catch (err) {
      setAuthMessage(err && err.message ? err.message : 'Authentication failed.', true);
    }
  }

  async function logout() {
    try {
      await requestJson('/auth/logout', { method: 'POST', body: '{}' });
    } catch (_err) {
      // Ignore logout errors and clear local UI state anyway.
    }
    authState.user = null;
    renderAuthState();
  }

  function startOAuth(provider) {
    root.location.href = `${getApiBaseUrl()}/auth/oauth/${provider}/start`;
  }

  function applyUrlFeedback() {
    const url = new URL(root.location.href);
    const authError = url.searchParams.get('authError');
    const authSuccess = url.searchParams.get('authSuccess');
    if (authError) {
      showAuthDialog('login');
      setAuthMessage(decodeURIComponent(authError), true);
      url.searchParams.delete('authError');
    } else if (authSuccess) {
      url.searchParams.delete('authSuccess');
    }
    if (authError || authSuccess) {
      root.history.replaceState({}, document.title, url.toString());
    }
  }

  let initialized = false;

  async function initializeAuthUi() {
    if (initialized) return;
    initialized = true;
    byId('auth-open-login')?.addEventListener('click', () => showAuthDialog('login'));
    byId('auth-open-register')?.addEventListener('click', () => showAuthDialog('register'));
    byId('auth-cancel-btn')?.addEventListener('click', hideAuthDialog);
    byId('auth-switch-mode-btn')?.addEventListener('click', () => {
      setAuthMode(document.body.dataset.authMode === 'register' ? 'login' : 'register');
    });
    byId('auth-logout-btn')?.addEventListener('click', logout);
    byId('auth-google-btn')?.addEventListener('click', () => startOAuth('google'));
    byId('auth-linkedin-btn')?.addEventListener('click', () => startOAuth('linkedin'));

    const form = byId('auth-form');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      submitAuthForm();
    });

    applyUrlFeedback();
    await refreshProviders();
    await refreshSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeAuthUi().catch((err) => {
        console.error('Failed to initialize NexaMap auth UI:', err);
      });
    }, { once: true });
  } else {
    initializeAuthUi().catch((err) => {
      console.error('Failed to initialize NexaMap auth UI:', err);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
