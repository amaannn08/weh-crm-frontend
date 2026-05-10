import React, { useState, useMemo, useEffect } from 'react'
import { Loader2, Search, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable } from './shared.jsx'
import { listSessionFounders } from '../../api/seedFounders'

/**
 * StreamingResultsView — shows live results as they stream in from the backend.
 * This is a temporary view that displays results in real-time before deduplication.
 * Once the stream completes, the user is navigated to the final SeededContentView.
 *
 * Props:
 *   sessionId    — UUID of the seed_sessions row
 *   sessionName  — display name for the search
 *   onStreamComplete — callback when stream is done (navigates to final results)
 */
export default function StreamingResultsView({
  sessionId,
  sessionName
}) {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)

  // Poll the database for live updates while streaming
  useEffect(() => {
    if (!sessionId) return

    const pollInterval = setInterval(async () => {
      try {
        const data = await listSessionFounders(sessionId)
        setRows(data.founders || [])
        setLoading(false)
      } catch (e) {
        console.error('[StreamingResultsView] poll error:', e.message)
      }
    }, 1000) // Poll every second for live updates

    return () => clearInterval(pollInterval)
  }, [sessionId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...rows]
      .filter(r => !q || [r.name, r.title, r.company_name, r.location].join(' ').toLowerCase().includes(q))
      .sort((a, b) => sortDir === 'desc'
        ? Number(b.icp_score) - Number(a.icp_score)
        : Number(a.icp_score) - Number(b.icp_score))
  }, [rows, search, sortDir])

  const avgScore = useMemo(() => {
    if (!filtered.length) return '—'
    return (filtered.reduce((acc, r) => acc + Number(r.icp_score || 0), 0) / filtered.length).toFixed(1)
  }, [filtered])

  return (
    <PageShell
      title={sessionName || 'Search in Progress'}
      subtitle={`Streaming results · ${rows.length} profiles found so far...`}
      rightHeaderSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD0AB] bg-[#FFEFE2] px-3 py-1.5 text-[11px] font-medium text-[#FF7102] shadow-sm animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Searching...
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            <span className="font-semibold text-[#1A1815]">{filtered.length}</span> Profiles
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            Avg ICP <span className="font-semibold text-[#1A1815]">{avgScore}</span>
          </span>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 py-2 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Filter by name, company, location…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none" />
          <button type="button" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FF7102] bg-[#FFEFE2] px-3 py-2 text-xs font-medium text-[#FF7102] transition-colors">
            {sortDir === 'desc' ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
            Score {sortDir === 'desc' ? '↓' : '↑'}
          </button>
          <span className="ml-auto text-xs text-[#9A958E] italic">Live results (may include duplicates)</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading && rows.length === 0
            ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" /></div>
            : <FounderTable
                rows={filtered}
                showStatus={false}
                showDelete={false}
                selectable={false}
                selectedIds={new Set()}
                onToggleSelect={() => {}}
                onToggleAll={() => {}}
              />
          }
        </div>
      </div>
    </PageShell>
  )
}
