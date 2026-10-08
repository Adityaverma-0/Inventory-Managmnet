export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v2';
export function session() {
  try { return JSON.parse(localStorage.getItem('salesman_session') || 'null'); } catch { return null; }
}
export async function request(path: string, body?: unknown, retainKey = false) {
  const auth = session();
  const headers: Record<string, string> = { Authorization: `Bearer ${auth?.token || ''}` };
  const identity = `pending:${auth?.user?.id}:${path}:${JSON.stringify(body)}`;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    const key = sessionStorage.getItem(identity) || crypto.randomUUID();
    sessionStorage.setItem(identity, key); headers['Idempotency-Key'] = key;
  }
  let res;
  try { res = await fetch(`${BASE_URL}${path}`, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new Error('Cannot reach the server. Your operation has not been confirmed; reconnect and retry.'); }
  const data = await res.json();
  if (res.status === 401) { localStorage.removeItem('salesman_session'); window.dispatchEvent(new Event('session-expired')); }
  if (!res.ok) {
    if (res.status < 500) sessionStorage.removeItem(identity);
    throw new Error(data.error || 'Request failed. Please retry.');
  }
  if (!retainKey) sessionStorage.removeItem(identity);
  return data;
}
export const apiSubmitUnloadRequest = (payload: unknown) => request('/unload-requests', payload);
export const apiGetUnloadRequest = (id: string) => request(`/unload-requests/${id}`);

export function acknowledge(path: string, body: unknown) {
  sessionStorage.removeItem(`pending:${session()?.user?.id}:${path}:${JSON.stringify(body)}`);
}
