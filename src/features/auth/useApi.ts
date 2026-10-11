import { useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

// Retain keys after an ambiguous network failure so a retry cannot duplicate stock.
const pending = new Map<string, string>();

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useApi(_options: { backendOnly?: boolean } = {}) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
    const mutation = options.method && !['GET','HEAD'].includes(options.method);
    const identity = `${token}:${url}:${options.method}:${options.body || ''}`;
    if (mutation) {
      const key = pending.get(identity) || generateUUID();
      pending.set(identity, key); headers.set('Idempotency-Key', key);
    }
    const response = await fetch(url, { ...options, headers });
    if (response.ok || response.status < 500) pending.delete(identity);
    if (response.status === 401) {
      logout(); navigate('/login?expired=true');
      throw new Error('Session expired, please log in again.');
    }
    return response;
  }, [token, logout, navigate]);
}
