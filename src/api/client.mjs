export const API_BASE = (import.meta.env?.VITE_API_BASE || 'http://127.0.0.1:8005/api').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const responseText = await response.text();
  let payload;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error('The API returned an invalid JSON response.');
  }
  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload;
}
