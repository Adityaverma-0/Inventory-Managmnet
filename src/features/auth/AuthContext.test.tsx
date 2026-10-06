import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

function TestComponent() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user?.username || 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <button onClick={() => login('fake-token', { id: '1', username: 'admin', role: 'ADMIN' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('provides default empty state and handles login/logout', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);

    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');

    act(() => { screen.getByText('Login').click(); });

    expect(screen.getByTestId('user').textContent).toBe('admin');
    expect(screen.getByTestId('token').textContent).toBe('fake-token');
    expect(localStorage.getItem('admin_token')).toBe('fake-token');

    act(() => { screen.getByText('Logout').click(); });

    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
