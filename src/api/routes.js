export const API_BASE = import.meta.env.VITE_API_URL ?? ''

export const routes = {
  login: API_BASE ? `${API_BASE}/auth/login` : '/api/auth/login',
  assistantChat: API_BASE ? `${API_BASE}/assistant/chat` : '/api/assistant/chat',
  conversations: API_BASE ? `${API_BASE}/conversations` : '/api/conversations',
  deals: API_BASE ? `${API_BASE}/deals` : '/api/deals',
  meetings: API_BASE ? `${API_BASE}/meetings` : '/api/meetings',
  news: API_BASE ? `${API_BASE}/news` : '/api/news',
  companies: API_BASE ? `${API_BASE}/companies` : '/api/companies',
  newsletters: API_BASE ? `${API_BASE}/newsletters` : '/api/newsletters',
  admin: API_BASE ? `${API_BASE}/admin` : '/api/admin',
  seedFounders: API_BASE ? `${API_BASE}/seed-founders` : '/api/seed-founders'
}

export function conversationUrl(id) {
  const base = API_BASE ? `${API_BASE}/conversations` : '/api/conversations'
  return `${base}/${id}`
}

export function dealUrl(id) {
  const base = API_BASE ? `${API_BASE}/deals` : '/api/deals'
  return `${base}/${id}`
}

export function dealScoreUrl(id) {
  const base = API_BASE ? `${API_BASE}/deals` : '/api/deals'
  return `${base}/${id}/score`
}

export function dealMeetingUrl(id) {
  const base = API_BASE ? `${API_BASE}/deals` : '/api/deals'
  return `${base}/${id}/meeting`
}
