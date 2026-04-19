import React, { useState, useMemo, useEffect } from 'react'
import { Loader2, Search, ArrowDownWideNarrow, ArrowUpNarrowWide, BookmarkPlus, CheckCircle2 } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable } from './shared.jsx'
import { saveBatch, saveLpBatch } from '../../api/seedFounders'

export default function SearchResultsView({ rows, onNewSearch, onSaved, onSavedLps, onRecentSearches }) {
  const [search, setSearch]       = useState('')
  const [sortDir, setSortDir]     = useState('desc')
  const [savingType, setSavingType] = useState(null)
  const [savedMsg, setSavedMsg]   = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  useEffect(() => {
    setSelectedIds(new Set())
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

  const isSavingFounders = savingType === 'founders'
  const isSavingLps = savingType === 'lps'

  const handleSaveFounders = async () => {
    if (selectedRows.length === 0) return
    setSavingType('founders')
    try {
      const res = await saveBatch(selectedRows)
      setSavedMsg(`Saved as founders: ${res.added} added${res.duplicates ? `, ${res.duplicates} duplicates` : ''}`)
    } catch (e) {
      setSavedMsg('Founder save failed: ' + e.message)
    } finally {
      setSavingType(null)
    }
  }

  const handleSaveLps = async () => {
    if (selectedRows.length === 0) return
    setSavingType('lps')
    try {
      const res = await saveLpBatch(selectedRows)
      setSavedMsg(`Saved as LPs: ${res.added} added${res.duplicates ? `, ${res.duplicates} duplicates` : ''}`)
    } catch (e) {
      setSavedMsg('LP save failed: ' + e.message)
    } finally {
      setSavingType(null)
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
          <button type="button" onClick={handleSaveFounders} disabled={isSavingLps || selectedRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7102] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06500] disabled:opacity-60 transition-colors">
            {isSavingFounders
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <BookmarkPlus className="h-3 w-3" />}
            {`Save ${selectedRows.length} as founders`}
          </button>
          <button type="button" onClick={handleSaveLps} disabled={isSavingFounders || selectedRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3A4A66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#314057] disabled:opacity-60 transition-colors">
            {isSavingLps
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <BookmarkPlus className="h-3 w-3" />}
            {`Save ${selectedRows.length} as LPs`}
          </button>
          {!!savedMsg && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8DB] bg-[#F2FBF3] px-3 py-1.5 text-[11px] font-medium text-[#2A6A3F]"><CheckCircle2 className="h-3 w-3" />{savedMsg}</span>}
          <button type="button" onClick={onSaved}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
            View saved
          </button>
          <button type="button" onClick={onSavedLps}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
            View saved LPs
          </button>
          <button type="button" onClick={onRecentSearches}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
            View recent searched
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
          <span className="ml-auto text-xs text-[#9A958E] italic">Preview mode — select rows, then save as Founder or LP</span>
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
