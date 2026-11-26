const TOKEN_KEY = 'wet.token';
const USER_KEY = 'wet.user';
const mockMode = import.meta.env.VITE_MOCK_MODE === 'true';
const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

function decodeExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number(payload.exp) * 1000;
  } catch {
    return 0;
  }
}

async function login(password) {
  if (mockMode) {
    if (!password || password !== (import.meta.env.VITE_MOCK_PASSWORD || 'admin')) {
      throw new Error('Invalid password.');
    }
    const session = { token: `mock.${Date.now()}`, user: { name: 'Administrator' } };
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    return session;
  }

  let response;
  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
  } catch {
    throw new Error('Backend is unavailable. Please try again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || body.detail || 'Invalid password.');
  }
  const data = await response.json();
  const user = { name: 'Administrator' };
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token: data.access_token, user };
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (decodeExpiry(token) && decodeExpiry(token) <= Date.now()) {
    logout();
    return null;
  }
  try {
    return { token, user: JSON.parse(localStorage.getItem(USER_KEY) || '{}') };
  } catch {
    return { token, user: {} };
  }
}

export const authService = { login, logout, getSession };
