import * as mock from './mockStorage';

const mockMode = import.meta.env.VITE_MOCK_MODE === 'true';
const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'wet.token';

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function unauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('wet.user');
  window.dispatchEvent(new Event('wet:unauthorized'));
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers }
    });
  } catch {
    throw new Error('Backend is unavailable. Please try again.');
  }

  if (response.status === 401) {
    unauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error?.message || body.detail || `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

function query(filters = {}) {
  const params = new URLSearchParams();
  const values = {
    search: filters.search || '',
    from_date: filters.from_date || filters.fromDate || '',
    to_date: filters.to_date || filters.toDate || '',
    side: filters.side || 'all'
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const string = params.toString();
  return string ? `?${string}` : '';
}

const backend = {
  getWedding: () => request('/wedding'),
  updateWedding: (payload) => request('/wedding', { method: 'PUT', body: JSON.stringify(payload) }),
  getExpenses: (filters) => request(`/expenses${query(filters)}`),
  createExpense: (payload) => request('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  updateExpense: (id, payload) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' })
};

export const api = mockMode ? mock : backend;
