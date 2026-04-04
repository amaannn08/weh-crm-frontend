import { apiHeaders, authFetch } from './client'
import { routes } from './routes'
import { cache } from './cache'

function withQuery(base, params = {}) {
  const url = new URL(base, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  if (url.origin !== window.location.origin) return url.toString()
  return url.pathname + url.search
}

// ── News ─────────────────────────────────────────────────────────────────────

export async function fetchNews(params = {}) {
  const key = 'news:' + JSON.stringify(params)
  return cache.get(key, async () => {
    const res = await authFetch(withQuery(routes.news, params), { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to fetch news')
    return res.json()
  })
}

export async function fetchNewsSummary() {
  return cache.get('news:summary', async () => {
    const res = await authFetch(`${routes.news}/summary`, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to fetch news summary')
    return res.json()
  }, 2 * 60 * 1000) // 2-min TTL — it's a computed aggregate
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function fetchCompanies(params = {}) {
  const key = 'companies:' + JSON.stringify(params)
  return cache.get(key, async () => {
    const res = await authFetch(withQuery(routes.companies, params), { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to fetch companies')
    return res.json()
  })
}

// ── Newsletter Issues ─────────────────────────────────────────────────────────

export async function fetchNewsletters(params = {}) {
  const key = 'newsletters:' + JSON.stringify(params)
  return cache.get(key, async () => {
    const res = await authFetch(withQuery(routes.newsletters, params), { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to fetch newsletters')
    return res.json()
  })
}

export async function fetchIssue(id) {
  return cache.get(`newsletter-issue:${id}`, async () => {
    const res = await authFetch(`${routes.newsletters}/${id}`, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to fetch issue')
    return res.json()
  })
}

export async function createNewsletter(title, periodLabel) {
  const res = await authFetch(routes.newsletters, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ title, period_label: periodLabel || null })
  })
  if (!res.ok) throw new Error('Failed to create newsletter')
  cache.invalidate('newsletters')
  return res.json()
}

export async function updateNewsletter(id, data) {
  const res = await authFetch(`${routes.newsletters}/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update newsletter')
  cache.invalidate(`newsletter-issue:${id}`)
  cache.invalidate('newsletters')
  return res.json()
}

export async function deleteNewsletter(id) {
  const res = await authFetch(`${routes.newsletters}/${id}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete newsletter')
  cache.invalidate('newsletters')
  return res.json()
}

export async function renderNewsletter(id) {
  const res = await authFetch(`${routes.newsletters}/${id}/render`, { headers: apiHeaders() })
  if (!res.ok) throw new Error('Failed to render newsletter')
  return res.json()
}

// ── Picks ─────────────────────────────────────────────────────────────────────

export async function addPick(issueId, newsItemId) {
  const res = await authFetch(`${routes.newsletters}/${issueId}/picks`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ news_item_id: newsItemId })
  })
  if (!res.ok) throw new Error('Failed to add pick')
  return res.json()
}

export async function removePick(issueId, pickId) {
  const res = await authFetch(`${routes.newsletters}/${issueId}/picks/${pickId}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to remove pick')
  return res.json()
}

export async function reorderPicks(issueId, order) {
  const res = await authFetch(`${routes.newsletters}/${issueId}/picks/reorder`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ order })
  })
  if (!res.ok) throw new Error('Failed to reorder picks')
  return res.json()
}

// ── Segments ──────────────────────────────────────────────────────────────────

export async function addSegment(issueId, data) {
  const res = await authFetch(`${routes.newsletters}/${issueId}/segments`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to add segment')
  return res.json()
}

export async function updateSegment(issueId, segId, data) {
  const res = await authFetch(`${routes.newsletters}/${issueId}/segments/${segId}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update segment')
  return res.json()
}

export async function deleteSegment(issueId, segId) {
  const res = await authFetch(`${routes.newsletters}/${issueId}/segments/${segId}`, {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete segment')
  return res.json()
}
