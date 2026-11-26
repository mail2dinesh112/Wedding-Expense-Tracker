import { useCallback, useEffect, useState } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [session, setSession] = useState(() => authService.getSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (password) => {
    setLoading(true);
    setError('');
    try {
      const next = await authService.login(password);
      setSession(next);
      return true;
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  useEffect(() => {
    window.addEventListener('wet:unauthorized', logout);
    return () => window.removeEventListener('wet:unauthorized', logout);
  }, [logout]);

  return { session, loading, error, login, logout };
}
