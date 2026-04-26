const SNAPSHOT_VERSION = 1
const DEALS_KEY = 'crm:session:deals'
const MEETINGS_KEY = 'crm:session:meetings'

function safeRead(key) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(key, value) {
  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemove(key) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // no-op: storage might be unavailable (private mode/quota/permissions)
  }
}

function normalizeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const missingPadding = padded.length % 4
  if (missingPadding === 0) return padded
  return `${padded}${'='.repeat(4 - missingPadding)}`
}

export function getUserKeyFromToken(token) {
  if (!token || typeof token !== 'string') return 'anonymous'
  const parts = token.split('.')
  if (parts.length !== 3) return 'anonymous'
  try {
    const payload = JSON.parse(atob(normalizeBase64Url(parts[1])))
    const userId = payload?.sub || payload?.userId || payload?.id || payload?.email
    return userId ? String(userId) : 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export function saveSessionSnapshot(key, data, userKey) {
  if (!Array.isArray(data)) return false
  const payload = {
    version: SNAPSHOT_VERSION,
    savedAt: Date.now(),
    userKey: userKey || 'anonymous',
    data
  }
  return safeWrite(key, JSON.stringify(payload))
}

export function readSessionSnapshot(key, userKey) {
  const raw = safeRead(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version !== SNAPSHOT_VERSION) return null
    if (parsed?.userKey !== (userKey || 'anonymous')) return null
    if (!Array.isArray(parsed?.data)) return null
    return parsed.data
  } catch {
    return null
  }
}

export function clearSessionSnapshot(userKey) {
  const keys = [DEALS_KEY, MEETINGS_KEY]
  keys.forEach((key) => {
    const snapshot = readSessionSnapshot(key, userKey)
    if (snapshot) safeRemove(key)
  })
  // Always remove keys as fallback when metadata parse fails.
  keys.forEach(safeRemove)
}

export const sessionKeys = {
  deals: DEALS_KEY,
  meetings: MEETINGS_KEY
}
