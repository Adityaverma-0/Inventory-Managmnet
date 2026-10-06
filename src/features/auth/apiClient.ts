export function createApiClient(token: string | null, onUnauthorized: () => void) {
  return async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      onUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }
    return response;
  };
}
