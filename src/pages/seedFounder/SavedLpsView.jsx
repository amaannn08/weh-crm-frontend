import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Loader2, Search } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable } from './shared.jsx'
import { listLps } from '../../api/seedFounders'

export default function SavedLpsView({ onNewSearch }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listLps({})
      setRows(data.lps || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...rows]
      .filter((r) => !q || [r.name, r.title, r.company_name, r.location].join(' ').toLowerCase().includes(q))
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
      title="Saved LPs"
      subtitle="Your saved LP list."
      rightHeaderSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            <span className="font-semibold text-[#1A1815]">{filtered.length}</span> / {rows.length} profiles
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
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 py-2 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Search LP by name, company, location…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none" />
          <button type="button" onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FF7102] bg-[#FFEFE2] px-3 py-2 text-xs font-medium text-[#FF7102] transition-colors">
            {sortDir === 'desc' ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
            Score {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading
            ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" /></div>
            : <FounderTable rows={filtered} showStatus={false} showDelete={false} />
          }
        </div>
      </div>
    </PageShell>
  )
}
