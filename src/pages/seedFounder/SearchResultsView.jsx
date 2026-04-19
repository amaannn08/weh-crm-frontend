import React, { useState, useMemo, useEffect } from 'react'
import { Loader2, Search, ArrowDownWideNarrow, ArrowUpNarrowWide, BookmarkPlus, CheckCircle2 } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable, scoreDotColor } from './shared.jsx'
import { saveBatch } from '../../api/seedFounders'

export default function SearchResultsView({ rows, onNewSearch, onSaved }) {
  const [search, setSearch]       = useState('')
  const [sortDir, setSortDir]     = useState('desc')
  const [saving, setSaving]       = useState(false)
  const [savedMsg, setSavedMsg]   = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  useEffect(() => {
    setSelectedIds(new Set(rows.map(r => r.linkedin_id)))
  }, [rows])

  const handleToggleSelect = (id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleToggleAll = (checked) => {
    if (checked) setSelectedIds(new Set(filtered.map(r => r.linkedin_id)))
    else setSelectedIds(new Set())
  }

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

  const selectedRows = useMemo(() => rows.filter(r => selectedIds.has(r.linkedin_id)), [rows, selectedIds])

  const handleSave = async () => {
    if (selectedRows.length === 0) return
    setSaving(true)
    try {
      const res = await saveBatch(selectedRows)
      setSavedMsg(`✓ ${res.added} founders saved${res.duplicates ? `, ${res.duplicates} already existed` : ''}`)
      setTimeout(() => { setSavedMsg(null); onSaved() }, 2000)
    } catch (e) {
      setSavedMsg('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="Search Results"
      subtitle={`${rows.length} founders found — preview only, not saved yet.`}
      rightHeaderSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            <span className="font-semibold text-[#1A1815]">{filtered.length}</span> Profiles
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            Avg ICP <span className="font-semibold text-[#1A1815]">{avgScore}</span>
          </span>
          <button type="button" onClick={handleSave} disabled={saving || !!savedMsg || selectedRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7102] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06500] disabled:opacity-60 transition-colors">
            {saving
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : savedMsg
                ? <CheckCircle2 className="h-3 w-3" />
                : <BookmarkPlus className="h-3 w-3" />}
            {savedMsg ?? `Save ${selectedRows.length} selected`}
          </button>
          <button type="button" onClick={onNewSearch}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors">
            <Search className="h-3 w-3" /> New search
          </button>
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
          <span className="ml-auto text-xs text-[#9A958E] italic">Preview mode — click "Save" to persist these results</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          <FounderTable rows={filtered} showStatus={false} showDelete={false} 
            selectable={true} selectedIds={selectedIds} 
            onToggleSelect={handleToggleSelect} onToggleAll={handleToggleAll} />
        </div>
      </div>
    </PageShell>
  )
}
