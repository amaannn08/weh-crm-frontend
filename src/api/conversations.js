import { apiHeaders, authFetch } from './client'
import { routes, conversationUrl } from './routes'
import { cache } from './cache'

/**
 * Fetch the list of all conversation sessions.
 * Cached with a 5-min TTL. Invalidated on create/delete.
 */
export async function fetchConversations() {
  return cache.get('conversations', async () => {
    const res = await authFetch(routes.conversations, { headers: apiHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  })
}

/**
 * Fetch the messages for a specific conversation session.
 * Cached per session id — invalidated when the session is deleted.
 * During an active chat, messages are held in React state and this is only
 * called once per session on first open.
 */
export async function fetchConversationMessages(sessionId) {
  return cache.get(`conversation-messages:${sessionId}`, async () => {
    const res = await authFetch(conversationUrl(sessionId), { headers: apiHeaders() })
    if (!res.ok) return null
    return res.json()
  })
}

/**
 * Create a new conversation session.
 * Invalidates the conversations list cache.
 */
export async function createConversation(title = '') {
  const res = await authFetch(routes.conversations, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ title })
  })
  if (!res.ok) throw new Error('Failed to create session')
  cache.invalidate('conversations')
  return res.json()
}

/**
 * Delete a conversation session.
 * Invalidates the list and the per-session message cache.
 */
export async function deleteConversation(sessionId) {
  const res = await authFetch(conversationUrl(sessionId), {
    method: 'DELETE',
    headers: apiHeaders()
  })
  if (res.status !== 404 && !res.ok) throw new Error('Failed to delete session')
  cache.invalidate('conversations')
  cache.invalidate(`conversation-messages:${sessionId}`)
}

