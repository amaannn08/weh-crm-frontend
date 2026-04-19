import { routes } from './routes'
import { apiHeaders, authFetch } from './client'
import { cache } from './cache'

const CACHE_KEY = 'seedFounders:list'

function parseSseEvent(raw) {
  const lines = raw.split('\n')
  let event = 'message'
  const dataLines = []

  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }

  if (!dataLines.length) return null
  const payloadText = dataLines.join('\n')
  try {
    return { event, payload: JSON.parse(payloadText) }
  } catch {
    return { event, payload: { message: payloadText } }
  }
}

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

export async function searchFoundersStream(params, { onEvent, signal } = {}) {
  const res = await authFetch(routes.seedFounders + '/search', {
    method: 'POST',
    headers: {
      ...apiHeaders(),
      Accept: 'text/event-stream'
    },
    body: JSON.stringify({ ...params, save: false }),
    signal
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Search failed')
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('text/event-stream') || !res.body) {
    const json = await res.json().catch(() => null)
    if (json) {
      onEvent?.('done', json)
      return json
    }
    throw new Error('Streaming unavailable for this response')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let donePayload = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const parsed = parseSseEvent(chunk)
      if (!parsed) continue
      // Supported stream events: ready, contract, progress, item_batch, done, error
      onEvent?.(parsed.event, parsed.payload)
      if (parsed.event === 'done') donePayload = parsed.payload
      if (parsed.event === 'error') {
        throw new Error(parsed.payload?.message || 'Search stream failed')
      }
    }
  }

  if (!donePayload) {
    throw new Error('Search stream ended before completion')
  }
  return donePayload
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

export async function listLps({ search, limit = 200, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('limit', limit)
  params.set('offset', offset)

  const res = await authFetch(`${routes.seedFounders}/lps?${params}`, { headers: apiHeaders() })
  if (!res.ok) throw new Error('Failed to load LPs')
  return res.json()
}

export async function listRecentSearches({ limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams()
  params.set('limit', limit)
  params.set('offset', offset)

  const res = await authFetch(`${routes.seedFounders}/recent-searches?${params}`, { headers: apiHeaders() })
  if (!res.ok) throw new Error('Failed to load recent searches')
  return res.json()
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

export async function saveLpBatch(lps) {
  const res = await authFetch(routes.seedFounders + '/save-lps-batch', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ lps })
  })
  if (!res.ok) throw new Error('Failed to save LPs')
  return res.json()
}

export async function cancelSeedSearch(websetId) {
  const res = await authFetch(routes.seedFounders + '/search/cancel', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ websetId })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to cancel seeding')
  }
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

export async function deleteLp(id) {
  const res = await authFetch(`${routes.seedFounders}/lps/${id}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete LP')
  return res.json()
}
