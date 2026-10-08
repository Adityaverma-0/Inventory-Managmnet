import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionMsg] = useState(() => new URLSearchParams(location.search).get('expired') ? 'Session expired, please log in again.' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v2'}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Could not reach the server. Please retry.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center dark:text-white">Admin Login</h1>
        {sessionMsg && !error && <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 text-sm">{sessionMsg}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                   className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                   className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
