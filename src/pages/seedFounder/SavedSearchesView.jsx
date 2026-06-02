import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, Trash2, Play, ChevronRight, ChevronLeft, RefreshCw, Pencil, Check, X, BookmarkPlus, CheckCircle2 } from 'lucide-react'
import PageShell from '../../components/PageShell'
import SeededContentView from './SeededContentView.jsx'
import { FounderTable } from './shared.jsx'
import {
  listSavedSearches,
  fetchSavedSearchesFresh,
  deleteSavedSearch,
  renameSavedSearch,
  listSavedSearchRuns,
  getSavedSearchRunResults,
  runSavedSearchNow,
  saveBatch,
  saveLpBatch
} from '../../api/seedFounders'
import { cache } from '../../api/cache'

// ── Legacy run results view (for runs without session_id) ─────────────────────
function LegacyRunResultsView({ run, searchName, savedSearchId, onBack, onNewSearch }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [savingType, setSavingType] = useState(null)
  const [savedMsg, setSavedMsg] = useState(null)

  useEffect(() => {
    if (!savedSearchId || !run?.id) { setLoading(false); return }
    setLoading(true)
    getSavedSearchRunResults(savedSearchId, run.id)
      .then(data => setRows(data.run?.results_json || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [savedSearchId, run?.id])

  const rowKey = r => r.linkedin_id || r.id || r.linkedin_url
  const selectedRows = rows.filter(r => selectedIds.has(rowKey(r)))

  const handleToggleSelect = (id, checked) => {
    setSelectedIds(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n })
  }
  const handleToggleAll = (checked) => {
    setSelectedIds(checked ? new Set(rows.map(rowKey)) : new Set())
  }

  const handleSaveFounders = async () => {
    if (!selectedRows.length) return
    setSavingType('founders')
    try {
      const res = await saveBatch(selectedRows)
      setSavedMsg(`Saved: ${res.added} added${res.duplicates ? `, ${res.duplicates} duplicates` : ''}`)
    } catch (e) { setSavedMsg('Failed: ' + e.message) }
    finally { setSavingType(null) }
  }

  const handleSaveLps = async () => {
    if (!selectedRows.length) return
    setSavingType('lps')
    try {
      const res = await saveLpBatch(selectedRows)
      setSavedMsg(`Saved as LPs: ${res.added} added${res.duplicates ? `, ${res.duplicates} duplicates` : ''}`)
    } catch (e) { setSavedMsg('Failed: ' + e.message) }
    finally { setSavingType(null) }
  }

  return (
    <PageShell
      title={searchName || 'Run Results'}
      subtitle={`${rows.length} founders found`}
      rightHeaderSlot={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleSaveFounders} disabled={savingType === 'lps' || !selectedRows.length}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7102] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e06500] disabled:opacity-60 transition-colors">
            {savingType === 'founders' ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookmarkPlus className="h-3 w-3" />}
            Save {selectedRows.length} as founders
          </button>
          <button type="button" onClick={handleSaveLps} disabled={savingType === 'founders' || !selectedRows.length}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3A4A66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#314057] disabled:opacity-60 transition-colors">
            {savingType === 'lps' ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookmarkPlus className="h-3 w-3" />}
            Save {selectedRows.length} as LPs
          </button>
          {savedMsg && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8DB] bg-[#F2FBF3] px-3 py-1.5 text-[11px] font-medium text-[#2A6A3F]">
              <CheckCircle2 className="h-3 w-3" />{savedMsg}
            </span>
          )}
          <button type="button" onClick={onBack}
            className="inline-flex items-center gap-1 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to runs
          </button>
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-auto bg-white">
        {loading
          ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" /></div>
          : rows.length === 0
            ? <p className="px-4 py-10 text-center text-sm text-[#9A958E]">No results for this run.</p>
            : <FounderTable
              rows={rows}
              showStatus={false}
              showDelete={false}
              selectable={true}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
            />
        }
      </div>
    </PageShell>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ExpandablePill({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return null

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
      className={`inline-block cursor-pointer rounded-lg border border-[#E8E5DE] bg-[#F5F4F0] px-2.5 py-1 text-[11px] text-[#5A5650] transition-all
        ${expanded ? 'whitespace-normal break-words' : 'max-w-[250px] truncate'}`}
      title={expanded ? "Click to collapse" : "Click to expand"}
    >
      {text}
    </span>
  )
}

function ParamPills({ params = {} }) {
  const chips = []
  if (params.query) chips.push(params.query)
  if (params.location && params.location !== 'All India') chips.push(params.location)
  if (params.stage && params.stage !== 'Any stage') chips.push(params.stage)
  if (params.sectors?.length) chips.push(...params.sectors)
  if (params.backgrounds?.length) chips.push(...params.backgrounds.slice(0, 3))
  if (!chips.length) chips.push('Founder search')
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {chips.map((c, i) => (
        <ExpandablePill key={i} text={c} />
      ))}
    </div>
  )
}

export default function SavedSearchesView({ onNewSearch, onSearchComplete, onStreamDone }) {
  const [savedSearches, setSavedSearches] = useState([])
  const [loading, setLoading] = useState(true)

  // Drill-down state
  const [selectedSearch, setSelectedSearch] = useState(null)
  const [runs, setRuns] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)

  // Run results drill-down
  const [selectedRun, setSelectedRun] = useState(null)

  const [runningId, setRunningId] = useState(null)
  const [runningStatus, setRunningStatus] = useState('')
  const [runningCount, setRunningCount] = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Always fetch fresh from server — bypass all caches
      const data = await fetchSavedSearchesFresh()
      setSavedSearches(data.savedSearches || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const forceRefresh = useCallback(async () => {
    await load()
  }, [load])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved search and all its results?')) return
    setDeletingId(id)
    try {
      await deleteSavedSearch(id)
      setSavedSearches(prev => prev.filter(s => s.id !== id))
      if (selectedSearch?.id === id) setSelectedSearch(null)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelectSearch = async (search) => {
    setSelectedSearch(search)
    setSelectedRun(null)
    setRunsLoading(true)
    try {
      const data = await listSavedSearchRuns(search.id)
      setRuns(data.runs || [])
    } finally {
      setRunsLoading(false)
    }
  }

  const refreshRuns = useCallback(async () => {
    if (!selectedSearch) return
    // Clear cache for this search's runs and reload
    cache.invalidate(`seedFounders:savedSearchRuns:${selectedSearch.id}`)
    setRunsLoading(true)
    try {
      const data = await listSavedSearchRuns(selectedSearch.id)
      setRuns(data.runs || [])
    } finally {
      setRunsLoading(false)
    }
  }, [selectedSearch])

  const handleSelectRun = (run) => {
    setSelectedRun(run)
  }

  const handleStartEdit = (s) => {
    setEditingId(s.id)
    setEditingName(s.name)
  }

  const handleSaveName = async (id) => {
    if (!editingName.trim()) return
    setSavingName(true)
    try {
      const updated = await renameSavedSearch(id, editingName.trim())
      setSavedSearches(prev => prev.map(s => s.id === id ? { ...s, name: updated.name } : s))
      setEditingId(null)
    } catch (e) {
      alert(e.message || 'Failed to rename')
    } finally {
      setSavingName(false)
    }
  }

  const runAbortRef = React.useRef(null)

  const handleRunNow = async (search) => {
    if (!window.confirm(`Run "${search.name}" now? This may take a few minutes.`)) return
    setRunningId(search.id)
    setRunningStatus('Starting...')
    setRunningCount(0)
    const controller = new AbortController()
    runAbortRef.current = controller

    let capturedSessionId = null
    let hasNavigated = false
    const liveRows = []

    const mergeRows = (incoming) => {
      const keyFor = r => r.linkedin_id || r.linkedin_url || `${r.name}:${r.company_name}`
      const map = new Map(liveRows.map(r => [keyFor(r), r]))
      for (const r of incoming) map.set(keyFor(r), r)
      liveRows.length = 0
      liveRows.push(...map.values())
    }

    try {
      await runSavedSearchNow(search.id, controller.signal, (event, payload) => {
        if (event === 'ready') {
          setRunningStatus(payload?.message || 'Search started')
          if (payload?.sessionId) capturedSessionId = payload.sessionId
        } else if (event === 'item_batch') {
          const total = payload?.totalSoFar ?? 0
          const batchRows = payload?.results || []
          mergeRows(batchRows)
          setRunningCount(total)
          setRunningStatus(`Found ${total} results...`)
          // Navigate on first batch to show live streaming
          if (!hasNavigated && liveRows.length > 0 && capturedSessionId && onSearchComplete) {
            hasNavigated = true
            console.log('[SavedSearchesView] Navigating to show live stream')
            onSearchComplete(capturedSessionId, search.name)
          }
        } else if (event === 'progress') {
          setRunningStatus(payload?.message || 'Searching...')
        } else if (event === 'done') {
          const finalSessionId = payload?.sessionId || capturedSessionId
          const finalCount = payload?.count || 0
          console.log('[SavedSearchesView] Stream complete and pruning done, navigating to final results')
          setRunningStatus(`Complete: ${finalCount} results (after dedup)`)

          // Backend has finished pruning - safe to navigate immediately
          onStreamDone?.()
        }
      })
      // Refresh runs list after completion (if user navigated back)
      await forceRefresh()
      if (selectedSearch?.id === search.id) {
        await refreshRuns()
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        alert(e.message || 'Run failed')
        setRunningStatus('Failed')
      } else {
        setRunningStatus('Cancelled')
      }
    } finally {
      setTimeout(() => {
        setRunningId(null)
        setRunningStatus('')
        setRunningCount(0)
      }, 2000)
      runAbortRef.current = null
    }
  }

  const handleStopRun = () => {
    runAbortRef.current?.abort()
    setRunningId(null)
  }

  // ── Run results view — uses SeededContentView (DB-backed) ───────────────────
  if (selectedRun) {
    // New architecture: run has a session_id → use SeededContentView
    if (selectedRun.session_id) {
      return (
        <SeededContentView
          sessionId={selectedRun.session_id}
          sessionName={selectedSearch?.name}
          onNewSearch={onNewSearch}
        />
      )
    }
    // Legacy runs without session_id → load results_json directly and display
    return (
      <LegacyRunResultsView
        run={selectedRun}
        searchName={selectedSearch?.name}
        savedSearchId={selectedSearch?.id}
        onBack={() => setSelectedRun(null)}
        onNewSearch={onNewSearch}
      />
    )
  }

  // ── Runs list view ────────────────────────────────────────────────────────
  if (selectedSearch) {
    return (
      <PageShell>
        <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSearch(null)}
                className="flex items-center gap-1 text-xs text-[#5A5650] hover:text-[#1A1815]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to saved searches
              </button>
              <button
                type="button"
                onClick={refreshRuns}
                disabled={runsLoading}
                title="Refresh runs"
                className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0] disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${runsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {runningId === selectedSearch.id && (
                <button
                  type="button"
                  onClick={handleStopRun}
                  className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRunNow(selectedSearch)}
                disabled={!!runningId}
                className="flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d2a26] disabled:opacity-60"
              >
                {runningId === selectedSearch.id
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
                  : <><Play className="w-3 h-3" /> Run now</>}
              </button>
            </div>
          </div>

          {runningId === selectedSearch.id && runningStatus && (
            <div className="rounded-xl border border-[#FFD0AB] bg-[#FFEFE2] px-4 py-2">
              <p className="text-xs text-[#C85A1A]">{runningStatus}</p>
              {runningCount > 0 && (
                <p className="text-[11px] text-[#9A958E] mt-0.5">Live results: {runningCount}</p>
              )}
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-[#1A1815]">{selectedSearch.name}</h2>
            <ParamPills params={selectedSearch.params_json} />
            <p className="text-[11px] text-[#9A958E] mt-1">
              Next scheduled run: {formatDate(selectedSearch.next_run_at)}
            </p>
          </div>

          {runsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#9A958E]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading runs…
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-[#9A958E]">No runs yet. Hit "Run now" to get the first batch.</p>
          ) : (
            <div className="rounded-2xl border border-[#E8E5DE] bg-white overflow-hidden">
              {runs.map((run, i) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => handleSelectRun(run)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAF8] transition-colors ${i > 0 ? 'border-t border-[#E8E5DE]' : ''}`}
                >
                  <div>
                    <p className="text-sm font-medium text-[#1A1815]">{formatDate(run.run_at)}</p>
                    <p className="text-[11px] text-[#9A958E]">{run.results_count} founders found</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9A958E]" />
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </PageShell>
    )
  }

  // ── Saved searches list ───────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="min-h-0 flex-1 overflow-auto">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#1A1815]">Saved Searches</h1>
            <button
              type="button"
              onClick={forceRefresh}
              disabled={loading}
              title="Refresh"
              className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button
            type="button"
            onClick={onNewSearch}
            className="rounded-full border border-[#E8E5DE] bg-white px-3 py-1 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0]"
          >
            + New search
          </button>
        </div>
        <p className="text-[11px] text-[#9A958E] -mt-2">
          Saved searches run automatically every week and store results per run.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#9A958E]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : savedSearches.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E5DE] bg-white p-6 text-center">
            <p className="text-sm text-[#9A958E]">No saved searches yet.</p>
            <p className="text-[11px] text-[#9A958E] mt-1">Run a search and click "Save search" to schedule it weekly.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8E5DE] bg-white overflow-hidden shadow-sm">
            {savedSearches.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAF8] ${i > 0 ? 'border-t border-[#E8E5DE]' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(s.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="w-full rounded-lg border border-[#FF7102] bg-white px-2 py-1 text-sm text-[#1A1815] focus:outline-none"
                    />
                  ) : (
                    <button type="button" onClick={() => handleSelectSearch(s)} className="w-full text-left">
                      <p className="text-sm font-medium text-[#1A1815] truncate">{s.name}</p>
                    </button>
                  )}
                  <ParamPills params={s.params_json} />
                  <p className="text-[11px] text-[#9A958E] mt-1">
                    {s.run_count} run{s.run_count !== 1 ? 's' : ''} · Last: {formatDate(s.last_run_at)} · Next: {formatDate(s.next_run_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {editingId === s.id ? (
                    <>
                      <button type="button" onClick={() => handleSaveName(s.id)} disabled={savingName} title="Save"
                        className="rounded-full border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 disabled:opacity-60">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} title="Cancel"
                        className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0]">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleStartEdit(s)} title="Rename"
                        className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0]">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleRunNow(s)} disabled={!!runningId} title="Run now"
                        className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0] disabled:opacity-60">
                        {runningId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      </button>
                      {runningId === s.id && (
                        <button type="button" onClick={handleStopRun} title="Stop"
                          className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100">
                          Stop
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} title="Delete"
                        className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-60">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </PageShell>
  )
}
