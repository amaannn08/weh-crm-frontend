import { routes } from './routes'
import { apiHeaders, authFetch } from './client'
import { cache } from './cache'

const CACHE_KEY = 'seedFounders:list'

export async function searchFounders(params) {
  const res = await authFetch(routes.seedFounders + '/search', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ ...params, save: false })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Search failed')
  }
  return res.json()
}

export async function listFounders({ search, stage, status, limit = 200, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (stage && stage !== 'All stages') params.set('stage', stage)
  if (status && status !== 'All') params.set('status', status)
  params.set('limit', limit)
  params.set('offset', offset)

  const key = `${CACHE_KEY}:${params}`
  return cache.get(key, async () => {
    const res = await authFetch(`${routes.seedFounders}?${params}`, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to load founders')
    return res.json()
  }, 60_000)
}

export async function saveBatch(founders) {
  const res = await authFetch(routes.seedFounders + '/save-batch', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ founders })
  })
  if (!res.ok) throw new Error('Failed to save founders')
  cache.invalidate(CACHE_KEY)
  return res.json()
}

export async function updateFounderStatus(id, status) {
  const res = await authFetch(`${routes.seedFounders}/${id}/status`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify({ status })
  })
  if (!res.ok) throw new Error('Failed to update status')
  cache.invalidate(CACHE_KEY)
  return res.json()
}

export async function deleteFounder(id) {
  const res = await authFetch(`${routes.seedFounders}/${id}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete founder')
  cache.invalidate(CACHE_KEY)
  return res.json()
}
