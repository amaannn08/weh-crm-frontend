import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import PageShell from '../../components/PageShell'

const RECENT_SEARCHES_KEY = 'seedFounder:recentSearches'

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export default function RecentSearchesView({ onNewSearch }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      const next = Array.isArray(parsed) ? parsed : []
      next.sort((a, b) => (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime())
      setRows(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === RECENT_SEARCHES_KEY) load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [load])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.query_text, r.status, r.webset_id, r.error_message].join(' ').toLowerCase().includes(q))
  }, [rows, filter])

  return (
    <PageShell
      title="Recent Searches"
      subtitle="Latest seeding runs with status and result counts."
      rightHeaderSlot={
        <button type="button" onClick={onNewSearch}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors">
          <Search className="h-3 w-3" /> New search
        </button>
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 py-2">
          <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by query, status, webset id..." 
            className="w-full max-w-md rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none" />
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" />
            </div>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur font-mono">
                <tr>
                  <th className="px-3 py-2.5 text-left">Query</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Results</th>
                  <th className="px-3 py-2.5 text-left">Created</th>
                  <th className="px-3 py-2.5 text-left">Completed</th>
                  <th className="px-3 py-2.5 text-left">Webset</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-[#9A958E]">No recent searches found.</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[#E8E5DE] hover:bg-[#FAFAF8]">
                    <td className="px-3 py-2.5 text-xs text-[#1A1815] max-w-[420px] truncate" title={r.queryText || r.query_text}>{r.queryText || r.query_text || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-[#5A5650]">{r.status || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-[#5A5650]">{r.resultsCount ?? r.results_count ?? 0}</td>
                    <td className="px-3 py-2.5 text-xs text-[#5A5650]">{fmt(r.createdAt || r.created_at)}</td>
                    <td className="px-3 py-2.5 text-xs text-[#5A5650]">{fmt(r.completedAt || r.completed_at)}</td>
                    <td className="px-3 py-2.5 text-xs text-[#9A958E] max-w-[220px] truncate" title={r.websetId || ''}>{r.websetId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageShell>
  )
}
