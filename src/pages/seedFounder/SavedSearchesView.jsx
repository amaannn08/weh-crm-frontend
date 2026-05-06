import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, Trash2, Play, ChevronRight, ChevronLeft, RefreshCw, Pencil, Check, X } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { FounderTable } from './shared.jsx'
import {
  listSavedSearches,
  deleteSavedSearch,
  renameSavedSearch,
  listSavedSearchRuns,
  getSavedSearchRunResults,
  runSavedSearchNow
} from '../../api/seedFounders'

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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
    <div className="flex flex-wrap gap-1 mt-1">
      {chips.map((c, i) => (
        <span key={i} className="rounded-full border border-[#E8E5DE] bg-[#F5F4F0] px-2 py-0.5 text-[10px] text-[#5A5650]">
          {c}
        </span>
      ))}
    </div>
  )
}

export default function SavedSearchesView({ onNewSearch }) {
  const [savedSearches, setSavedSearches] = useState([])
  const [loading, setLoading] = useState(true)

  // Drill-down state
  const [selectedSearch, setSelectedSearch] = useState(null) // saved search object
  const [runs, setRuns] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)

  // Run results drill-down
  const [selectedRun, setSelectedRun] = useState(null)
  const [runResults, setRunResults] = useState([])
  const [runResultsLoading, setRunResultsLoading] = useState(false)

  // Running state
  const [runningId, setRunningId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listSavedSearches()
      setSavedSearches(data.savedSearches || [])
    } finally {
      setLoading(false)
    }
  }, [])

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
    setRunResults([])
    setRunsLoading(true)
    try {
      const data = await listSavedSearchRuns(search.id)
      setRuns(data.runs || [])
    } finally {
      setRunsLoading(false)
    }
  }

  const handleSelectRun = async (run) => {
    setSelectedRun(run)
    setRunResultsLoading(true)
    try {
      const data = await getSavedSearchRunResults(selectedSearch.id, run.id)
      setRunResults(data.run?.results_json || [])
    } finally {
      setRunResultsLoading(false)
    }
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

  const handleRunNow = async (search) => {
    if (!window.confirm(`Run "${search.name}" now? This may take a few minutes.`)) return
    setRunningId(search.id)
    try {
      await runSavedSearchNow(search.id)
      // Refresh the list and runs if viewing this search
      await load()
      if (selectedSearch?.id === search.id) {
        const data = await listSavedSearchRuns(search.id)
        setRuns(data.runs || [])
      }
    } catch (e) {
      alert(e.message || 'Run failed')
    } finally {
      setRunningId(null)
    }
  }

  // ── Run results view ──────────────────────────────────────────────────────
  if (selectedRun) {
    return (
      <PageShell>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRun(null)}
              className="flex items-center gap-1 text-xs text-[#5A5650] hover:text-[#1A1815]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to runs
            </button>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1A1815]">{selectedSearch?.name}</h2>
            <p className="text-[11px] text-[#9A958E]">
              Run on {formatDate(selectedRun.run_at)} · {selectedRun.results_count} results
            </p>
          </div>
          {runResultsLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#9A958E]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading results…
            </div>
          ) : runResults.length === 0 ? (
            <p className="text-sm text-[#9A958E]">No results for this run.</p>
          ) : (
            <FounderTable
              rows={runResults}
              selectedIds={new Set()}
              onToggleSelect={() => {}}
              onToggleAll={() => {}}
              onStatusChange={() => {}}
              onDelete={() => {}}
              selectable={false}
              showStatus={false}
            />
          )}
        </div>
      </PageShell>
    )
  }

  // ── Runs list view ────────────────────────────────────────────────────────
  if (selectedSearch) {
    return (
      <PageShell>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
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
              onClick={() => handleRunNow(selectedSearch)}
              disabled={runningId === selectedSearch.id}
              className="flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d2a26] disabled:opacity-60"
            >
              {runningId === selectedSearch.id
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
                : <><Play className="w-3 h-3" /> Run now</>}
            </button>
          </div>

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
      </PageShell>
    )
  }

  // ── Saved searches list ───────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold text-[#1A1815]">Saved Searches</h1>
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
          <div className="rounded-2xl border border-[#E8E5DE] bg-white overflow-hidden">
            {savedSearches.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-[#E8E5DE]' : ''}`}
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
                      <button type="button" onClick={() => handleRunNow(s)} disabled={runningId === s.id} title="Run now"
                        className="rounded-full border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0] disabled:opacity-60">
                        {runningId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      </button>
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
    </PageShell>
  )
}
