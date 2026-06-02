import { routes } from './routes'
import { apiHeaders, authFetch } from './client'
import { cache } from './cache'
import { getPreloadedFounders, getPreloadedLps, getPreloadedSavedSearches, invalidatePreloadedData } from '../utils/dataPreloader'

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
    body: JSON.stringify(params)
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
    body: JSON.stringify(params),
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

export async function listFounders({ search, stage, status, limit = 500, offset = 0 } = {}) {
  // If no filters, use preloaded data for instant load
  if (!search && (!stage || stage === 'All stages') && (!status || status === 'All') && offset === 0) {
    const preloaded = getPreloadedFounders()
    if (preloaded) {
      console.log('[API] Using preloaded founders data')
      return preloaded
    }
  }

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
  // If no filters, use preloaded data for instant load
  if (!search && offset === 0) {
    const preloaded = getPreloadedLps()
    if (preloaded) {
      console.log('[API] Using preloaded LPs data')
      return preloaded
    }
  }

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

// ─── Sessions (new staging layer) ────────────────────────────────────────────

export async function listSessions({ source, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (source) params.set('source', source)
  params.set('limit', limit)
  params.set('offset', offset)

  const res = await authFetch(`${routes.seedFounders}/sessions?${params}`, { headers: apiHeaders() })
  if (!res.ok) throw new Error('Failed to load sessions')
  return res.json()
}

export async function listSessionFounders(sessionId, { search, limit = 200, offset = 0 } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('limit', limit)
  params.set('offset', offset)

  const key = `seedFounders:sessionFounders:${sessionId}:${params}`
  return cache.get(key, async () => {
    const res = await authFetch(`${routes.seedFounders}/sessions/${sessionId}/founders?${params}`, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to load session founders')
    return res.json()
  }, 30_000)
}

export async function deleteSession(sessionId) {
  const res = await authFetch(`${routes.seedFounders}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete session')
  // Bust the sessions list cache so the table refreshes
  cache.invalidate('seedFounders:sessions')
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
  invalidatePreloadedData() // Force refresh preloaded data
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

// ─── Saved Searches ──────────────────────────────────────────────────────────

const SAVED_SEARCHES_CACHE_KEY = 'seedFounders:savedSearches'
const SAVED_SEARCH_RUNS_CACHE_KEY = 'seedFounders:savedSearchRuns'
const SAVED_SEARCH_RUN_RESULTS_CACHE_KEY = 'seedFounders:savedSearchRunResults'
const SAVED_SEARCHES_LOCALSTORAGE_KEY = 'seedFounders:savedSearches:localStorage'

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

function loadFromLocalStorage(key, maxAge = 5 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > maxAge) return null
    return parsed.data
  } catch (e) {
    return null
  }
}

export async function createSavedSearch(name, params) {
  const res = await authFetch(`${routes.seedFounders}/saved-searches`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ name, params })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to save search')
  }
  // Invalidate saved searches list cache
  cache.invalidate(SAVED_SEARCHES_CACHE_KEY)
  localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
  invalidatePreloadedData() // Force refresh preloaded data
  return res.json()
}

export async function createSavedSearchAndRun(name, params, signal, onProgress = null) {
  // First create the saved search
  const saved = await createSavedSearch(name, params)
  
  // Then immediately trigger the first run with streaming
  try {
    await runSavedSearchNow(saved.id, signal, onProgress)
    // Invalidate saved searches cache so the list shows updated run count
    cache.invalidate(SAVED_SEARCHES_CACHE_KEY)
    localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
    return { ...saved, firstRunStarted: true }
  } catch (e) {
    // If run fails, still return the saved search (it was created successfully)
    console.warn('First run failed:', e)
    return { ...saved, firstRunStarted: false, firstRunError: e.message }
  }
}

export async function listSavedSearches() {
  // Try preloaded data first for instant load
  const preloaded = getPreloadedSavedSearches()
  if (preloaded) {
    console.log('[API] Using preloaded saved searches data')
    // Return preloaded immediately, fetch fresh in background
    setTimeout(() => {
      authFetch(`${routes.seedFounders}/saved-searches`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            cache.set(SAVED_SEARCHES_CACHE_KEY, data, 300_000)
            saveToLocalStorage(SAVED_SEARCHES_LOCALSTORAGE_KEY, data)
          }
        })
        .catch(() => {})
    }, 0)
    return preloaded
  }

  // If in-memory cache is still valid, use it (means we just fetched fresh)
  if (cache.has(SAVED_SEARCHES_CACHE_KEY)) {
    return cache.get(SAVED_SEARCHES_CACHE_KEY, async () => {
      const res = await authFetch(`${routes.seedFounders}/saved-searches`, { headers: apiHeaders() })
      if (!res.ok) throw new Error('Failed to load saved searches')
      const data = await res.json()
      saveToLocalStorage(SAVED_SEARCHES_LOCALSTORAGE_KEY, data)
      return data
    }, 300_000)
  }

  // Try localStorage cache only when in-memory is empty
  const cached = loadFromLocalStorage(SAVED_SEARCHES_LOCALSTORAGE_KEY, 5 * 60 * 1000)
  if (cached) {
    // Warm the in-memory cache and return
    cache.set(SAVED_SEARCHES_CACHE_KEY, cached, 300_000)
    return cached
  }

  // No cache anywhere — fetch fresh
  const res = await authFetch(`${routes.seedFounders}/saved-searches`, { headers: apiHeaders() })
  if (!res.ok) throw new Error('Failed to load saved searches')
  const data = await res.json()
  cache.set(SAVED_SEARCHES_CACHE_KEY, data, 300_000)
  saveToLocalStorage(SAVED_SEARCHES_LOCALSTORAGE_KEY, data)
  return data
}

/**
 * Always fetches saved searches directly from the server, bypassing all caches.
 * Use this for the SavedSearchesView load/refresh to guarantee fresh data.
 */
export async function fetchSavedSearchesFresh() {
  const res = await authFetch(`${routes.seedFounders}/saved-searches`, { headers: apiHeaders() })
  if (!res.ok) throw new Error('Failed to load saved searches')
  const data = await res.json()
  // Update both caches with the fresh data
  cache.set(SAVED_SEARCHES_CACHE_KEY, data, 300_000)
  saveToLocalStorage(SAVED_SEARCHES_LOCALSTORAGE_KEY, data)
  invalidatePreloadedData()
  return data
}

export async function deleteSavedSearch(id) {
  const res = await authFetch(`${routes.seedFounders}/saved-searches/${id}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete saved search')
  // Invalidate all related caches
  cache.invalidate(SAVED_SEARCHES_CACHE_KEY)
  cache.invalidate(`${SAVED_SEARCH_RUNS_CACHE_KEY}:${id}`)
  cache.invalidate(`${SAVED_SEARCH_RUN_RESULTS_CACHE_KEY}:${id}`)
  localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
  return res.json()
}

export async function renameSavedSearch(id, name) {
  const res = await authFetch(`${routes.seedFounders}/saved-searches/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify({ name })
  })
  if (!res.ok) throw new Error('Failed to rename saved search')
  // Invalidate saved searches list cache
  cache.invalidate(SAVED_SEARCHES_CACHE_KEY)
  localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
  return res.json()
}

export async function listSavedSearchRuns(id) {
  const key = `${SAVED_SEARCH_RUNS_CACHE_KEY}:${id}`
  return cache.get(key, async () => {
    const res = await authFetch(`${routes.seedFounders}/saved-searches/${id}/results`, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to load runs')
    return res.json()
  }, 30_000) // Cache for 30 seconds
}

export async function getSavedSearchRunResults(searchId, runId) {
  const key = `${SAVED_SEARCH_RUN_RESULTS_CACHE_KEY}:${searchId}:${runId}`
  return cache.get(key, async () => {
    const res = await authFetch(`${routes.seedFounders}/saved-searches/${searchId}/results/${runId}`, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to load run results')
    return res.json()
  }, 120_000) // Cache for 2 minutes (results don't change)
}

export async function saveSearchRun(savedSearchId, results, runId = null) {
  const res = await authFetch(`${routes.seedFounders}/saved-searches/${savedSearchId}/runs`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ results, runId })
  })
  if (!res.ok) throw new Error('Failed to save run')
  // Invalidate runs cache for this saved search
  cache.invalidate(`${SAVED_SEARCH_RUNS_CACHE_KEY}:${savedSearchId}`)
  cache.invalidate(SAVED_SEARCHES_CACHE_KEY) // Also invalidate list to update run counts
  localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
  return res.json()
}

export async function runSavedSearchNow(id, signal, onProgress = null) {
  const res = await authFetch(`${routes.seedFounders}/saved-searches/${id}/run`, {
    method: 'POST',
    headers: {
      ...apiHeaders(),
      Accept: 'text/event-stream'
    },
    signal
  })
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to run search')
  }

  const contentType = res.headers.get('content-type') || ''
  
  // If SSE streaming is available
  if (contentType.includes('text/event-stream') && res.body) {
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
        onProgress?.(parsed.event, parsed.payload)
        if (parsed.event === 'done') donePayload = parsed.payload
        if (parsed.event === 'error') {
          throw new Error(parsed.payload?.message || 'Run failed')
        }
      }
    }

    // Invalidate caches after successful run
    cache.invalidate(SAVED_SEARCHES_CACHE_KEY)
    cache.invalidate(`${SAVED_SEARCH_RUNS_CACHE_KEY}:${id}`)
    localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
    
    return donePayload || { success: true }
  }
  
  // Fallback to JSON response
  const json = await res.json()
  cache.invalidate(SAVED_SEARCHES_CACHE_KEY)
  cache.invalidate(`${SAVED_SEARCH_RUNS_CACHE_KEY}:${id}`)
  localStorage.removeItem(SAVED_SEARCHES_LOCALSTORAGE_KEY)
  return json
}
