// Farmer auth against the Express API (/api/auth/*).
//
// Flow: send-otp → verify-otp → { alreadyRegistered ? login(phone, nic) : register(details) }
//
// The access token (15 min) is kept in memory only. The refresh token (7 days) is an
// httpOnly, SameSite=Strict cookie set by the API, so requests must be same-origin:
// in dev, vite.config.js proxies /api/auth to the API (127.0.0.1:8005). Set VITE_AUTH_URL
// only if the API is served from the same site as the portal.

const AUTH_URL = `${(import.meta.env.VITE_AUTH_URL || '').replace(/\/$/, '')}/api/auth`;
const TIMEOUT_MS = 15000;

let accessToken = null;
let refreshing = null;

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const hasAccessToken = () => Boolean(accessToken);
export const clearSession = () => { accessToken = null; };

async function request(path, { method = 'GET', body, token } = {}) {
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
    throw new AuthError('Cannot reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || data.error || `Request failed (${res.status})`;
    throw new AuthError(res.status >= 500 ? 'Server error. Please try again shortly.' : message, res.status);
  }
  return data;
}

// Calls with the access token, refreshing it once (via the cookie) if missing or expired.
async function authed(path, opts = {}) {
  if (!accessToken) await refreshSession();
  try {
    return await request(path, { ...opts, token: accessToken });
  } catch (err) {
    if (err.status !== 401) throw err;
    await refreshSession();
    return request(path, { ...opts, token: accessToken });
  }
}

export function refreshSession() {
  // Share one in-flight refresh: the API rotates the refresh token on every call.
  refreshing ??= request('/refresh_token')
    .then((data) => { accessToken = data.accessToken; return accessToken; })
    .catch((err) => { accessToken = null; throw err; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export const sendOtp = (phone) => request('/send-otp', { method: 'POST', body: { phone } });

// → { alreadyRegistered: boolean }
export const verifyOtp = (phone, otp) => request('/verify-otp', { method: 'POST', body: { phone, otp } });

// → farmer row from the API
export async function login(phone, nic) {
  const data = await request('/login', { method: 'POST', body: { phone, nic } });
  accessToken = data.accessToken;
  return data.farmer;
}

// → { farmer_id, full_name, phone }
export async function register(details) {
  const data = await request('/register', { method: 'POST', body: details });
  accessToken = data.accessToken;
  return data.data;
}

export async function getProfile() {
  const data = await authed('/profile');
  return data.data?.[0] || null;
}

export async function logout() {
  try {
    await request('/logout', { method: 'POST' });
  } finally {
    accessToken = null;
  }
}

// Shape the API farmer row into the portal's `farm` object.
export function farmFromProfile(farmer, existing) {
  const fallbackCrops = farmer.land_acres
    ? [{ id: 'api', category: 'paddy', type: farmer.primary_crop || 'Paddy', variety: '', acres: Number(farmer.land_acres), yield: '', unit: 'kg' }]
    : [];
  return {
    ...existing,
    id: farmCode(farmer.farmer_id),
    farmerId: farmer.farmer_id,
    name: farmer.full_name,
    address: farmer.address ?? existing?.address,
    district: farmer.district ?? existing?.district,
    division: farmer.division ?? existing?.division,
    crops: existing?.crops?.length ? existing.crops : fallbackCrops,
    pin: existing?.pin ?? (farmer.farm_latitude != null ? { lat: Number(farmer.farm_latitude), lng: Number(farmer.farm_longitude) } : null),
  };
}

// Short, readable Farm ID from the farmer UUID.
export const farmCode = (uuid) => `FAR-${String(uuid).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
