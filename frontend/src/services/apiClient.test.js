import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './apiClient';
import { authService } from './authService';

const jwt = () => {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
};

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

describe('backend integration', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in and stores the JWT', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ access_token: jwt() }));
    const session = await authService.login('secret');
    expect(session.token).toBeTruthy();
    expect(localStorage.getItem('wet.token')).toBe(session.token);
    expect(global.fetch.mock.calls[0][0]).toContain('/auth/login');
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ password: 'secret' });
  });

  it('surfaces backend error messages on login failure', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ error: { message: 'Invalid credentials' } }, 401));
    await expect(authService.login('wrong')).rejects.toThrow('Invalid credentials');
  });

  it('maps frontend filter names to backend query params', async () => {
    localStorage.setItem('wet.token', jwt());
    global.fetch.mockResolvedValue(jsonResponse([]));
    await api.getExpenses({ fromDate: '2026-11-01', toDate: '2026-11-30', side: 'groom', search: 'tea' });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('from_date=2026-11-01');
    expect(url).toContain('to_date=2026-11-30');
    expect(url).toContain('side=groom');
    expect(url).toContain('search=tea');
  });

  it('sends the bearer token and clears it on 401', async () => {
    localStorage.setItem('wet.token', jwt());
    const listener = vi.fn();
    window.addEventListener('wet:unauthorized', listener);
    global.fetch.mockResolvedValue(jsonResponse({ error: { message: 'Invalid or expired token' } }, 401));
    await expect(api.getWedding()).rejects.toThrow('Session expired');
    expect(localStorage.getItem('wet.token')).toBeNull();
    expect(listener).toHaveBeenCalled();
    window.removeEventListener('wet:unauthorized', listener);
  });

  it('reports backend unavailability clearly', async () => {
    global.fetch.mockRejectedValue(new Error('network down'));
    await expect(api.getWedding()).rejects.toThrow('Backend is unavailable');
  });
});
