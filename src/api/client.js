import { authHeaders, clearToken } from '../auth'

export function apiHeaders(contentType = 'application/json') {
  const base = authHeaders()
  if (!contentType) return { ...base }
  return { 'Content-Type': contentType, ...base }
}

/**
 * Drop-in replacement for fetch() that auto-fires 'auth:expired'
 * on a 401 response so AuthContext can log the user out globally.
 *
 * Use this instead of raw fetch() for all authenticated requests.
 */
export async function authFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (res.status === 401) {
    // Clear token immediately so cached entries behind the guard also fail
    clearToken()
    window.dispatchEvent(new Event('auth:expired'))
  }
  return res
}

// Backwards-compat alias
export const apiFetch = authFetch

