import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Loader2, Search, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable } from './shared.jsx'
import { STATUS_TAB_COLORS } from './constants.js'
import { listFounders, updateFounderStatus, deleteFounder } from '../../api/seedFounders'

const ALL_STATUSES = ['All', 'New', 'Contacted', 'In Review', 'Pass', 'Invested']

export default function SavedFoundersView({ onNewSearch }) {
  const [rows, setRows]           = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [sortDir, setSortDir]     = useState('desc')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listFounders({})
      setRows(data.founders || [])
      setStatusCounts(data.statusCounts || {})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleStatusChange = useCallback(async (id, status) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    try { await updateFounderStatus(id, status) } catch (e) { console.error(e) }
  }, [])

  const handleDelete = useCallback(async (id) => {
    setRows(prev => prev.filter(r => r.id !== id))
    try { await deleteFounder(id) } catch (e) { console.error(e) }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...rows]
      .filter(r => {
        if (activeStatus !== 'All' && r.status !== activeStatus) return false
        if (q && ![r.name, r.title, r.company_name, r.location].join(' ').toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => sortDir === 'desc'
        ? Number(b.icp_score) - Number(a.icp_score)
        : Number(a.icp_score) - Number(b.icp_score))
  }, [rows, search, activeStatus, sortDir])

  const avgScore = useMemo(() => {
    if (!filtered.length) return '—'
    return (filtered.reduce((a, r) => a + Number(r.icp_score || 0), 0) / filtered.length).toFixed(1)
  }, [filtered])

  const totalCount = rows.length

  return (
    <PageShell
      title="Saved Founders"
      subtitle="Your saved founder list — manage status, filter by pipeline stage."
      rightHeaderSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            <span className="font-semibold text-[#1A1815]">{filtered.length}</span> / {totalCount} profiles
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            Avg ICP <span className="font-semibold text-[#1A1815]">{avgScore}</span>
          </span>
          <button type="button" onClick={onNewSearch}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors">
            <Search className="h-3 w-3" /> New search
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {/* Status Tabs */}
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 pt-2">
          <div className="flex items-center gap-1">
            {ALL_STATUSES.map(s => {
              const cnt = s === 'All' ? rows.length : (statusCounts[s] || 0)
              const colors = STATUS_TAB_COLORS[s] || STATUS_TAB_COLORS['All']
              const isActive = activeStatus === s
              return (
                <button key={s} type="button" onClick={() => setActiveStatus(s)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${isActive ? colors.active : colors.inactive}`}>
                  {s}
                  {cnt > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/60' : 'bg-[#F0EDE6] text-[#9A958E]'}`}>
                      {cnt}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter bar */}
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 py-2 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Search name, company, location…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none" />
          <button type="button" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FF7102] bg-[#FFEFE2] px-3 py-2 text-xs font-medium text-[#FF7102] transition-colors">
            {sortDir === 'desc' ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
            Score {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading
            ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" /></div>
            : <FounderTable rows={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} showStatus showDelete />
          }
        </div>
      </div>
    </PageShell>
  )
}
