import { apiHeaders, authFetch } from './client'
import { routes, dealMeetingUrl } from './routes'
import { cache } from './cache'

export async function fetchMeetings(options = {}) {
  if (options.force) cache.invalidate('meetings')
  return cache.get('meetings', async () => {
    const res = await authFetch(routes.meetings, { headers: apiHeaders() })
    if (!res.ok) throw new Error('Failed to fetch meetings')
    return res.json()
  })
}

export async function fetchDealMeeting(dealId) {
  return cache.get(`deal-meeting:${dealId}`, async () => {
    const res = await authFetch(dealMeetingUrl(dealId), { headers: apiHeaders() })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch deal meeting')
    return res.json()
  })
}

export async function createDealMeeting(dealId, payload) {
  const res = await authFetch(dealMeetingUrl(dealId), {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Failed to create deal meeting')
  cache.invalidate('meetings')
  cache.invalidate(`deal-meeting:${dealId}`)
  return res.json()
}

export async function updateDealMeeting(dealId, patch) {
  const res = await authFetch(dealMeetingUrl(dealId), {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(patch)
  })
  if (!res.ok) throw new Error('Failed to update deal meeting')
  cache.invalidate('meetings')
  cache.invalidate(`deal-meeting:${dealId}`)
  return res.json()
}

export async function deleteDealMeeting(dealId) {
  const res = await authFetch(dealMeetingUrl(dealId), { method: 'DELETE', headers: apiHeaders() })
  if (res.status === 404) return
  if (!res.ok) throw new Error('Failed to delete deal meeting')
  cache.invalidate('meetings')
  cache.invalidate(`deal-meeting:${dealId}`)
}


