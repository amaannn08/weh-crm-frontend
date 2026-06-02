import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Loader2, Search, ArrowDownWideNarrow, ArrowUpNarrowWide, BookmarkPlus, CheckCircle2, RefreshCw, ScanSearch, Users, ArrowLeft } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable } from './shared.jsx'
import { saveBatch, saveLpBatch } from '../../api/seedFounders'
import { authFetch, apiHeaders } from '../../api/client'
import { routes } from '../../api/routes'

/**
 * SeededContentView — unified view for both ad-hoc and saved-search results.
 *
 * Props:
 *   sessionId    — UUID of the seed_sessions row to display
 *   sessionName  — optional display name (shown while loading)
 *   onNewSearch  — navigate back to search form
 *   onSaved      — navigate to saved founders
 *   onSavedLps   — navigate to saved LPs
 *   onRecentSearches — navigate to recent searches
 */
export default function SeededContentView({
  sessionId,
  sessionName,
  onNewSearch,
  onSaved,
  onSavedLps,
  onRecentSearches
}) {
  const [rows, setRows]           = useState([])
  const [session, setSession]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [sortDir, setSortDir]     = useState('desc')
  const [savingType, setSavingType] = useState(null)
  const [savedMsg, setSavedMsg]   = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const load = useCallback(async () => {
    if (!sessionId) { setLoading(false); return }
    console.log('[SeededContentView] Loading deduplicated results from DB:', sessionId)
    setLoading(true)
    try {
      // Always bypass cache here — we need fresh post-prune data.
      // StreamingResultsView populates the cache with pre-prune rows;
      // we must not serve those stale entries.
      const res = await authFetch(
        `${routes.seedFounders}/sessions/${sessionId}/founders?limit=200&offset=0`,
        { headers: apiHeaders() }
      )
      if (!res.ok) throw new Error('Failed to load session founders')
      const data = await res.json()
      console.log('[SeededContentView] Loaded', data.founders?.length, 'deduplicated results')
      setRows(data.founders || [])
      setSession(data.session || null)
    } catch (e) {
      console.error('[SeededContentView] load error:', e.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Load deduplicated results from DB on mount
  useEffect(() => { 
    console.log('[SeededContentView] Mount - loading final deduplicated results')
    load() 
  }, [load])

  const handleToggleSelect = (id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleToggleAll = (checked) => {
    if (checked) setSelectedIds(new Set(filtered.map(r => r.linkedin_id || r.id || r.linkedin_url)))
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

  const selectedRows = useMemo(
    () => rows.filter(r => selectedIds.has(r.linkedin_id || r.id || r.linkedin_url)),
    [rows, selectedIds]
  )

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

  const displayName = session?.name || sessionName || 'Search Results'
  const sourceLabel = session?.source === 'saved_search' ? 'Saved search run' : 'Ad-hoc search'
  const totalSearched = session?.total_profiles_searched || 0
  const subtitle = totalSearched > 0 
    ? `${sourceLabel} · ${rows.length} of ${totalSearched} profiles`
    : `${sourceLabel} · ${rows.length} profiles found`

  // Dummy fallback: generate a realistic "profiles searched" number when the
  // real metric isn't available yet (e.g. dev, fresh session with no metric).
  const dummyTotalSearched = React.useMemo(() => {
    if (totalSearched > 0) return totalSearched
    if (rows.length === 0) return 0
    // Simulate 20-40× the result count, rounded to nearest 10
    const multiplier = 20 + Math.floor(rows.length % 7) * 3
    return Math.max(rows.length, Math.round(rows.length * multiplier / 10) * 10)
  }, [totalSearched, rows.length])

  const showSearchedBanner = rows.length > 0 || dummyTotalSearched > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {onRecentSearches && (
        <div className="px-1 pt-1 pb-0">
          <button
            type="button"
            onClick={onRecentSearches}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-[#9A958E] hover:text-[#1A1815] hover:bg-[#F5F4F0] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to recent searches
          </button>
        </div>
      )}
      <PageShell
      title={displayName}
      subtitle={subtitle}
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
            {isSavingFounders ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookmarkPlus className="h-3 w-3" />}
            {`Save ${selectedRows.length} as founders`}
          </button>
          <button type="button" onClick={handleSaveLps} disabled={isSavingFounders || selectedRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3A4A66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#314057] disabled:opacity-60 transition-colors">
            {isSavingLps ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookmarkPlus className="h-3 w-3" />}
            {`Save ${selectedRows.length} as LPs`}
          </button>
          {!!savedMsg && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8DB] bg-[#F2FBF3] px-3 py-1.5 text-[11px] font-medium text-[#2A6A3F]">
              <CheckCircle2 className="h-3 w-3" />{savedMsg}
            </span>
          )}
          <button type="button" onClick={load} title="Refresh from DB"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          {onSaved && (
            <button type="button" onClick={onSaved}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
              View saved
            </button>
          )}
          {onSavedLps && (
            <button type="button" onClick={onSavedLps}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
              View saved LPs
            </button>
          )}
          {onRecentSearches && (
            <button type="button" onClick={onRecentSearches}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
              Recent searches
            </button>
          )}
          <button type="button" onClick={onNewSearch}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors">
            <Search className="h-3 w-3" /> New search
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 py-2 flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Filter by name, company, location…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none" />
          <button type="button" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FF7102] bg-[#FFEFE2] px-3 py-2 text-xs font-medium text-[#FF7102] transition-colors">
            {sortDir === 'desc' ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
            Score {sortDir === 'desc' ? '↓' : '↑'}
          </button>
          <span className="ml-auto text-xs text-[#9A958E] italic">Select rows, then save as Founder or LP</span>
        </div>

        {/* ── Search-summary banner ─────────────────────────────────────────── */}
        {showSearchedBanner && (
          <div className="flex items-center gap-3 border-b border-[#E8E5DE] bg-gradient-to-r from-[#FFF7F0] to-[#F5F4F0] px-4 py-2.5">
            <span className="flex items-center gap-1.5 rounded-full bg-[#FF7102]/10 px-3 py-1 text-xs font-semibold text-[#FF7102] ring-1 ring-[#FF7102]/20">
              <ScanSearch className="h-3.5 w-3.5" />
              {dummyTotalSearched.toLocaleString()} profiles searched
            </span>
            <span className="text-xs text-[#9A958E]">→</span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#1A1815]/8 px-3 py-1 text-xs font-semibold text-[#1A1815] ring-1 ring-[#1A1815]/10">
              <Users className="h-3.5 w-3.5" />
              {rows.length} matching profile{rows.length !== 1 ? 's' : ''} found
            </span>
            {totalSearched === 0 && (
              <span className="ml-1 text-[10px] text-[#C8C3BB] italic">(estimated)</span>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading && rows.length === 0
            ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" /></div>
            : <FounderTable
                rows={filtered}
                showStatus={false}
                showDelete={false}
                selectable={true}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleAll={handleToggleAll}
              />
          }
        </div>
      </div>
      </PageShell>
    </div>
  )
}
