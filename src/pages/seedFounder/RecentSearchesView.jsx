import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import PageShell from '../../components/PageShell'
import { listSessions, fetchSessionsFresh, deleteSession } from '../../api/seedFounders'

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    failed:    'bg-red-50 text-red-700 border border-red-200',
    running:   'bg-blue-50 text-blue-700 border border-blue-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
      {status === 'running' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
      {status || '—'}
    </span>
  )
}

export default function RecentSearchesView({ onNewSearch, onViewSession }) {
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [filter, setFilter]         = useState('')
  const [deletingId, setDeletingId] = useState(null)  // row being deleted
  const [confirmId, setConfirmId]   = useState(null)  // row awaiting confirm

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = force ? await fetchSessionsFresh({ limit: 100 }) : await listSessions({ limit: 100 })
      setRows(data.sessions || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Clicking anywhere else cancels the confirm state
  useEffect(() => {
    if (!confirmId) return
    const clear = () => setConfirmId(null)
    window.addEventListener('click', clear, { once: true })
    return () => window.removeEventListener('click', clear)
  }, [confirmId])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.name, r.status, r.webset_id, r.source, r.error_message]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [rows, filter])

  const handleRowClick = (row) => {
    if (!row.id || row.status === 'running') return
    onViewSession?.(row.id, row.name || 'Search results')
  }

  const handleDeleteClick = async (e, row) => {
    e.stopPropagation() // don't trigger row click / view session

    // First click → ask for confirmation
    if (confirmId !== row.id) {
      setConfirmId(row.id)
      return
    }

    // Second click → do the delete
    setConfirmId(null)
    setDeletingId(row.id)
    setRows(prev => prev.filter(r => r.id !== row.id)) // optimistic remove
    try {
      await deleteSession(row.id)
    } catch (e) {
      setRows(prev => [row, ...prev]) // restore on failure
      setError(`Delete failed: ${e.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageShell
      title="Recent Searches"
      subtitle="All seeding runs with status and result counts. Click a row to view its results."
      rightHeaderSlot={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-semibold text-[#5A5650] hover:bg-[#FAFAF8] transition-colors">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <button type="button" onClick={onNewSearch}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors">
            <Search className="h-3 w-3" /> New search
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 py-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by query, status, source, webset id..."
            className="w-full max-w-md rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF7102]" />
            </div>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur font-mono">
                <tr>
                  <th className="px-3 py-2.5 text-left">Query / Name</th>
                  <th className="px-3 py-2.5 text-left">Source</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Results</th>
                  <th className="px-3 py-2.5 text-left">Created</th>
                  <th className="px-3 py-2.5 text-left">Completed</th>
                  <th className="px-3 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs text-[#9A958E]">
                      No recent searches found.
                    </td>
                  </tr>
                ) : filtered.map((r) => {
                  const isClickable = r.status !== 'running' && !!onViewSession
                  const isDeleting  = deletingId === r.id
                  const isConfirm   = confirmId === r.id
                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleRowClick(r)}
                      className={`border-b border-[#E8E5DE] transition-colors group
                        ${isClickable ? 'cursor-pointer hover:bg-[#FFF8F3]' : 'cursor-default hover:bg-[#FAFAF8]'}`}
                    >
                      <td className="px-3 py-2.5 text-xs text-[#1A1815] max-w-[300px]">
                        <span className="truncate block" title={r.name}>{r.name || '—'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#9A958E] capitalize">{r.source || 'adhoc'}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2.5 text-xs text-[#5A5650] font-mono">
                        {r.results_count ?? 0}
                        {r.total_profiles_searched > 0 && (
                          <span className="text-[#C8C3BB]"> / {r.total_profiles_searched}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#5A5650]">{fmt(r.created_at)}</td>
                      <td className="px-3 py-2.5 text-xs text-[#5A5650]">{fmt(r.completed_at)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          {isClickable && (
                            <ExternalLink className="h-3.5 w-3.5 text-[#C8C3BB] opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, r)}
                            disabled={isDeleting}
                            title={isConfirm ? 'Click again to confirm' : 'Delete session'}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all
                              ${isConfirm
                                ? 'border-red-300 bg-red-100 text-red-600 opacity-100'
                                : 'border-transparent text-[#C8C3BB] opacity-0 group-hover:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
                              }
                              ${isDeleting ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            {isDeleting
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />
                            }
                            {isConfirm && <span>Confirm?</span>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageShell>
  )
}
