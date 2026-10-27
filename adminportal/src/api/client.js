// Talks to the API's /admin routes. The access token lives only in memory; the refresh token is
// an httpOnly cookie the API sets on /admin/auth, so a reload signs back in through refresh().
const BASE = import.meta.env.VITE_API_URL || ''

let accessToken = null
let refreshing = null

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function send(path, { method = 'GET', body, token = accessToken } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check that the API is running.', 0)
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.message || data.error || `Request failed (${response.status})`, response.status)
  }
  return data
}

// One refresh at a time, however many requests hit an expired token together
export function refresh() {
  refreshing ||= send('/admin/auth/refresh_token', { method: 'POST', token: null })
    .then((data) => {
      accessToken = data.accessToken
      return accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

let onSignedOut = () => {}
export const setSignedOutHandler = (handler) => {
  onSignedOut = handler
}

export async function api(path, options = {}) {
  try {
    return await send(path, options)
  } catch (error) {
    if (error.status !== 401) throw error
    try {
      await refresh()
    } catch {
      accessToken = null
      onSignedOut()
      throw new ApiError('Your session ended. Sign in again.', 401)
    }
    return send(path, options)
  }
}

export async function signIn(username, password) {
  const data = await send('/admin/auth/login', { method: 'POST', body: { username, password }, token: null })
  accessToken = data.accessToken
  return data.admin
}

export async function signOut() {
  try {
    await send('/admin/auth/logout', { method: 'POST', token: null })
  } finally {
    accessToken = null
  }
}

// The signed-in admin after a page load, or null
export async function restoreSession() {
  try {
    await refresh()
  } catch {
    return null
  }
  const data = await send('/admin/auth/me')
  return data.admin
}
