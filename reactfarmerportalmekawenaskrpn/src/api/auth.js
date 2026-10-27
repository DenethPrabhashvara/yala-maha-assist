// Farmer auth against the Express API (API/routes/authroutes.js).
//
// Flow: send-otp → verify-otp → register (new number) or login with NIC (existing number).
// The access token (15 min) is kept in memory only; the refresh token is an httpOnly cookie
// set by the API, so a reload gets a new access token from /refresh_token.
//
// By default requests are relative (/api/...) and Vite proxies them to the API, which keeps
// the refresh cookie same-origin. Set VITE_AUTH_API_URL only if the API allows this origin
// with credentials in its CORS config.

const AUTH_URL = (import.meta.env.VITE_AUTH_API_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 15000;

let accessToken = null;
let refreshing = null;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Also used by api/reservoirs.js for the public data routes.
export async function request(path, { method = 'GET', body, token } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${AUTH_URL}${path}`, {
      method,
      credentials: 'include',
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || data.error || `Request failed (${res.status})`, res.status);
  return data;
}

export const sendOtp = (phone) => request('/api/auth/send-otp', { method: 'POST', body: { phone } });

// Resolves to { alreadyRegistered } once the code is accepted.
export const verifyOtp = (phone, otp) => request('/api/auth/verify-otp', { method: 'POST', body: { phone, otp } });

export async function register(details) {
  const res = await request('/api/auth/register', { method: 'POST', body: details });
  accessToken = res.accessToken;
  return res.data; // { farmer_id, farm_id, full_name, phone }
}

export async function login(phone, nic) {
  const res = await request('/api/auth/login', { method: 'POST', body: { phone, nic } });
  accessToken = res.accessToken;
  return res.farmer;
}

export function refreshToken() {
  // One refresh at a time: the API rotates the cookie, so parallel refreshes would race.
  refreshing ??= request('/api/auth/refresh_token')
    .then((res) => { accessToken = res.accessToken; return res.accessToken; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

// Calls an endpoint that needs the Bearer token, refreshing once if it has expired.
async function authed(path, opts) {
  if (!accessToken) await refreshToken();
  try {
    return await request(path, { ...opts, token: accessToken });
  } catch (err) {
    if (err.status !== 401) throw err;
    await refreshToken();
    return request(path, { ...opts, token: accessToken });
  }
}

export async function getProfile() {
  const res = await authed('/api/auth/profile');
  const farmer = res.data?.[0];
  if (!farmer) throw new ApiError('Farmer account not found.', 401);
  return farmer;
}

// Saves farm changes for the signed-in farmer. Phone and NIC cannot be changed.
export async function updateProfile(changes) {
  const res = await authed('/api/auth/profile', { method: 'PATCH', body: changes });
  return res.data;
}

// Replaces the farm's water source, location label and crop list.
export async function saveFarmDetails(farm) {
  const res = await authed('/api/auth/farm', { method: 'PUT', body: farm });
  return res.data;
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    accessToken = null;
  }
}

// The API stores the farm's water source as a numeric reservoir id; the portal lists them by name.
export async function findReservoirId(name) {
  if (!name) return null;
  const res = await request('/api/data/reservoir');
  const key = name.trim().toLowerCase();
  return res.data?.find((r) => r.name.trim().toLowerCase() === key)?.id ?? null;
}

export async function findReservoirName(id) {
  if (id == null) return null;
  const res = await request(`/api/data/reservoir/${encodeURIComponent(id)}`);
  return res.data?.const?.name ?? null;
}
