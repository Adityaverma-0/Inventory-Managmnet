import { useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export function useApi() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const fetchApi = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      logout();
      navigate('/login?expired=true');
      throw new Error('Session expired, please log in again.');
    }
    return response;
  }, [token, logout, navigate]);

  return fetchApi;
}
