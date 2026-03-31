import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealData } from '../context/DealDataContext'
import PageShell from '../components/PageShell'
import { createDeal, deleteDeal, ingestTranscript, updateDeal } from '../api/deals'
import AddMeetingModal from '../components/AddMeetingModal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// ---------------------------------------------------------------------------
// Add / Edit Deal Modal
// ---------------------------------------------------------------------------
const DEAL_FIELDS = [
  { key: 'company', label: 'Company name', required: true },
  { key: 'poc', label: 'Point of contact (WEH)' },
  { key: 'sector', label: 'Sector' },
  { key: 'status', label: 'Status', type: 'select', options: ['New', 'Active Diligence', 'Watch', 'Pass', 'Portfolio'] },
  { key: 'founder_name', label: 'Founder name' },
  { key: 'company_domain', label: 'Company domain' },
  { key: 'meeting_date', label: 'Meeting date', type: 'date' },
  { key: 'stage', label: 'Stage' },
  { key: 'exciting_reason', label: 'Why exciting', type: 'textarea' },
  { key: 'risks', label: 'Risks', type: 'textarea' },
  { key: 'action_required', label: 'Action required', type: 'textarea' },
]

function DealModal({ deal, onClose, onSave }) {
  const isEdit = !!deal
  const [form, setForm] = useState(
    isEdit ? { ...deal } : { status: 'New' }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company?.trim()) { setError('Company name is required'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save deal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#E8E5DE] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1A1815]">
            {isEdit ? `Edit — ${deal.company}` : 'Add new deal'}
          </h2>
          <button type="button" onClick={onClose} className="text-[#9A958E] hover:text-[#1A1815] text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {DEAL_FIELDS.map(({ key, label, required, type, options }) => {
            if (type === 'select') {
              return (
                <div key={key}>
                  <label className="block text-[11px] font-medium text-[#9A958E] mb-1">{label}</label>
                  <select
                    value={form[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="w-full rounded-lg border border-[#E8E5DE] bg-white px-3 py-2 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
                  >
                    <option value="">Select…</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )
            }
            if (type === 'textarea') {
              return (
                <div key={key}>
                  <label className="block text-[11px] font-medium text-[#9A958E] mb-1">{label}</label>
                  <textarea
                    value={form[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-[#E8E5DE] bg-white px-3 py-2 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none resize-none"
                  />
                </div>
              )
            }
            return (
              <div key={key}>
                <label className="block text-[11px] font-medium text-[#9A958E] mb-1">
                  {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type={type || 'text'}
                  value={form[key] || ''}
                  onChange={e => handleChange(key, e.target.value)}
                  required={required}
                  className="w-full rounded-lg border border-[#E8E5DE] bg-white px-3 py-2 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
                />
              </div>
            )
          })}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-[#E8E5DE] px-5 py-3">
          <button type="button" onClick={onClose}
            className="rounded-full border border-[#E8E5DE] px-4 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0]">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="rounded-full bg-[#1A1815] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 hover:bg-[#333]">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add deal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete confirm modal
// ---------------------------------------------------------------------------
function DeleteConfirmModal({ company, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#1A1815]">Delete "{company}"?</h2>
        <p className="mt-2 text-xs text-[#5A5650]">
          This will permanently remove the deal, its meetings, scores, and insights. This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-full border border-[#E8E5DE] px-4 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60 hover:bg-red-700">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status colour map (matches Meetings design)
// ---------------------------------------------------------------------------
const DEAL_STATUS_COLORS = {
  Pass: { dot: '#B42318', pill: 'bg-[#FEF3F2] text-[#B42318]' },
  Portfolio: { dot: '#3D7A58', pill: 'bg-[#E8F5EE] text-[#3D7A58]' },
  'Active Diligence': { dot: '#FF7102', pill: 'bg-[#FFEFE2] text-[#FF7102]' },
  Watch: { dot: '#3A5F8C', pill: 'bg-[#E8EEF7] text-[#3A5F8C]' },
  New: { dot: '#3A5F8C', pill: 'bg-[#E8EEF7] text-[#3A5F8C]' },
}
function getDealStatusStyle(status) {
  return DEAL_STATUS_COLORS[status] || { dot: '#9A958E', pill: 'bg-[#F5F4F0] text-[#5A5650]' }
}

// ---------------------------------------------------------------------------
// Deal card row
// ---------------------------------------------------------------------------
function DealCard({ deal, onView, onAddMeeting, onEdit, onDelete }) {
  const lastMeeting = deal.meeting_date || deal.date || null
  const date = lastMeeting ? formatDate(lastMeeting) : null
  const score = deal.founder_final_score ?? null
  const status = deal.status || 'New'
  const { dot, pill } = getDealStatusStyle(status)

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-[#E8E5DE] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(26,24,21,0.04),0_1px_3px_rgba(26,24,21,0.06)] transition-all hover:border-[#D4CFC4] hover:shadow-[0_4px_12px_rgba(26,24,21,0.10)]">
      {/* Status dot */}
      <span
        className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />

      {/* Company + sector — clicks to view */}
      <button
        type="button"
        onClick={onView}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-[14px] font-semibold text-[#1A1815]">{deal.company}</div>
        {(deal.sector || deal.business_model) && (
          <div className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#C8C3BB]">
            {deal.sector || deal.business_model}
          </div>
        )}
      </button>

      {/* POC — fixed width */}
      <div className="hidden w-32 shrink-0 items-center gap-1.5 sm:flex">
        {deal.poc ? (
          <>
            <svg className="h-3 w-3 shrink-0 text-[#C8C3BB]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="truncate text-[12px] text-[#5A5650]">{deal.poc}</span>
          </>
        ) : (
          <span className="text-[12px] text-[#C8C3BB]">—</span>
        )}
      </div>

      {/* Date — fixed width */}
      <div className="hidden w-32 shrink-0 items-center gap-1.5 md:flex">
        {date ? (
          <>
            <svg className="h-3 w-3 shrink-0 text-[#C8C3BB]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-[12px] font-mono text-[#9A958E]">{date}</span>
          </>
        ) : (
          <span className="text-[12px] font-mono text-[#C8C3BB]">—</span>
        )}
      </div>

      {/* Score — fixed width */}
      <div className="hidden w-16 shrink-0 items-center justify-center md:flex">
        {score != null ? (
          <span className="inline-flex items-center justify-center rounded-full border border-[#E8E5DE] bg-[#FAFAF8] px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[#1A1815]">
            {Number(score).toFixed(1)}
          </span>
        ) : (
          <span className="text-[12px] font-mono text-[#C8C3BB]">—</span>
        )}
      </div>

      {/* Status pill — fixed width */}
      <div className="w-32 shrink-0 flex justify-end">
        <span className={`inline-flex items-center justify-center rounded-[4px] px-2 py-0.5 text-[9px] font-mono font-medium uppercase tracking-[0.10em] whitespace-nowrap ${pill}`}>
          {status}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onAddMeeting} title="Add meeting"
          className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#9A958E] hover:bg-[#F5F4F0] hover:text-[#FF7102] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h3a1 1 0 100-2H6zm0 4a1 1 0 000 2h6a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </button>
        <button type="button" onClick={onEdit} title="Edit deal"
          className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#9A958E] hover:bg-[#F5F4F0] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button type="button" onClick={onDelete} title="Delete deal"
          className="rounded-lg border border-red-100 bg-white p-1.5 text-red-300 hover:bg-red-50 hover:text-red-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function DealsTableView({ filteredDeals, onViewDeal, onAddMeetingForDeal, onEditDeal, onDeleteDeal }) {
  if (filteredDeals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F4F0] text-3xl">📊</div>
        <p className="text-[14px] font-semibold text-[#1A1815]">No deals match your filters</p>
        <p className="mt-1 text-[12px] text-[#9A958E]">Try adjusting your search or filters</p>
      </div>
    )
  }
  return (
    <div className="space-y-2 pb-4">
      {filteredDeals.map((deal) => (
        <DealCard
          key={deal.id}
          deal={deal}
          onView={() => onViewDeal(deal)}
          onAddMeeting={() => onAddMeetingForDeal(deal)}
          onEdit={() => onEditDeal(deal)}
          onDelete={() => onDeleteDeal(deal)}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function DealsPage() {
  const navigate = useNavigate()
  const { deals, loadDeals, dealsLoading, updateDealInCache, meetings, removeMeetingFromCache } = useDealData()
  const [error, setError] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [ingesting, setIngesting] = useState(false)
  const fileInputRef = useRef(null)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editDeal, setEditDeal] = useState(null)            // deal obj or null
  const [deletingDeal, setDeletingDeal] = useState(null)    // deal obj or null
  const [isDeleting, setIsDeleting] = useState(false)
  const [addMeetingModalDeal, setAddMeetingModalDeal] = useState(null)

  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState('0')
  const [industryFilter, setIndustryFilter] = useState('All industries')
  const [sortField, setSortField] = useState('score') // 'score' | 'date'
  const [sortOrder, setSortOrder] = useState('desc')  // 'desc' = highest/newest first

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortOrder('desc') // reset to desc when switching field
    }
  }

  useEffect(() => {
    loadDeals().catch(() => setError('Failed to load deals'))
  }, [loadDeals])

  const industries = useMemo(() => {
    const sectors = new Set(
      deals.map((d) => d.sector).filter(Boolean).map((s) => s.trim())
    )
    return ['All industries', ...Array.from(sectors)]
  }, [deals])

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase()
    const min = Number(minScore) || 0

    const filtered = deals.filter((deal) => {
      if (query && !deal.company.toLowerCase().includes(query) &&
        !(deal.sector || '').toLowerCase().includes(query) &&
        !(deal.business_model || '').toLowerCase().includes(query)) return false
      if (industryFilter !== 'All industries' && (deal.sector || '').trim() !== industryFilter) return false
      const score = deal.founder_final_score
      if (score != null && Number(score) < min) return false
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortField === 'date') {
        const da = a.meeting_date || a.date || null
        const db = b.meeting_date || b.date || null
        const ta = da ? new Date(da).getTime() : -Infinity
        const tb = db ? new Date(db).getTime() : -Infinity
        return sortOrder === 'desc' ? tb - ta : ta - tb
      }
      // default: score
      const sa = a.founder_final_score != null ? Number(a.founder_final_score) : -Infinity
      const sb = b.founder_final_score != null ? Number(b.founder_final_score) : -Infinity
      return sortOrder === 'desc' ? sb - sa : sa - sb
    })

    return filtered
  }, [deals, industryFilter, minScore, search, sortField, sortOrder])

  const summaryCards = useMemo(() => {
    const total = filteredDeals.length
    const scored = filteredDeals.filter(d => d.founder_final_score != null && d.founder_final_score !== '')
    const avgScore = scored.length === 0
      ? '—'
      : (scored.reduce((acc, d) => acc + Number(d.founder_final_score || 0), 0) / scored.length).toFixed(1)
    return [
      { label: 'Total deals', value: total || '0', helper: 'Across all stages', tone: 'neutral' },
      { label: 'Avg founder score', value: avgScore, helper: scored.length ? `${scored.length} scored` : 'No scores yet', tone: 'warm' }
    ]
  }, [filteredDeals])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleViewDeal = (deal) => navigate(`/deals/${deal.id}`)

  const handleAddMeeting = (deal) => {
    setAddMeetingModalDeal(deal)
  }

  const handleAddDeal = async (form) => {
    await createDeal(form)
    await loadDeals(true)
  }

  const handleEditDeal = async (form) => {
    const updated = await updateDeal(editDeal.id, form)
    updateDealInCache(updated)
  }

  const handleConfirmDelete = async () => {
    if (!deletingDeal) return
    setIsDeleting(true)
    try {
      await deleteDeal(deletingDeal.id)
      // Remove associated meeting from cache if it exists
      const dealMeeting = meetings.find(m => m.deal_id === deletingDeal.id)
      if (dealMeeting) removeMeetingFromCache(dealMeeting.id)
      await loadDeals(true)
      setDeletingDeal(null)
    } catch (err) {
      setError(err.message || 'Failed to delete deal')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIngesting(true)
    setUploadStatus(null)
    try {
      const result = await ingestTranscript(file)
      const action = result.mode === 'merged' ? 'merged into' : 'created'
      setUploadStatus({ ok: true, message: `✓ "${result.company}" ${action} successfully` })
      await loadDeals(true)
    } catch (err) {
      setUploadStatus({ ok: false, message: err.message || 'Upload failed' })
    } finally {
      setIngesting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------
  if (dealsLoading && !deals.length) {
    return (
      <PageShell title="All deals" subtitle="…" summaryCards={summaryCards}>
        <div className="flex h-full items-center justify-center text-sm text-neutral-400">Loading deals…</div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title="All deals" subtitle="…">
        <div className="flex h-full items-center justify-center text-sm text-red-400">{error}</div>
      </PageShell>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      <PageShell
        title="All deals"
        subtitle="Track every company in your funnel across intros, follow-ups, and diligence conversations."
        rightHeaderSlot={
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={handleFileChange} />

            {/* Stat chips — inline with buttons */}
            {summaryCards.map(card => (
              <span key={card.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
                <span className="font-semibold text-[#1A1815]">{card.value}</span>
                <span>{card.label}</span>
              </span>
            ))}

            {/* Add Deal */}
            <button type="button" onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333]">

              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add deal
            </button>

            {/* Upload transcript */}
            <button type="button" onClick={handleUploadClick} disabled={ingesting}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1815] shadow-sm hover:bg-[#F5F4F0] disabled:opacity-60">
              {ingesting ? (
                <>
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Ingesting…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Upload transcript
                </>
              )}
            </button>

            {uploadStatus && (
              <span className={`text-xs font-medium ${uploadStatus.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {uploadStatus.message}
              </span>
            )}
          </div>
        }
      >
        <div className="flex h-full flex-col gap-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(26,24,21,0.04)] focus-within:border-[#FF7102] transition-colors">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#C8C3BB]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387-1.414 1.414-4.387-4.387zM8 14A6 6 0 108 2a6 6 0 000 12z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search company, sector…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 bg-transparent text-[13px] text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(26,24,21,0.04)]">
              <span className="whitespace-nowrap text-[11px] text-[#9A958E]">Min score</span>
              <input
                type="number" min="0" max="10" step="0.5"
                value={minScore} onChange={(e) => setMinScore(e.target.value)}
                className="w-12 bg-transparent text-[13px] text-[#1A1815] focus:outline-none"
              />
            </div>

            <select
              value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}
              className="rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 text-[13px] text-[#1A1815] shadow-[0_1px_2px_rgba(26,24,21,0.04)] focus:border-[#FF7102] focus:outline-none max-w-[160px]"
            >
              {industries.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleSort('score')}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-colors ${sortField === 'score'
                  ? 'border-[#FF7102] bg-[#FFEFE2] text-[#FF7102]'
                  : 'border-[#E8E5DE] bg-white text-[#5A5650] shadow-[0_1px_2px_rgba(26,24,21,0.04)] hover:bg-[#F5F4F0]'
                }`}
            >
              Score {sortField === 'score' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>

            <button
              type="button"
              onClick={() => handleSort('date')}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-colors ${sortField === 'date'
                  ? 'border-[#FF7102] bg-[#FFEFE2] text-[#FF7102]'
                  : 'border-[#E8E5DE] bg-white text-[#5A5650] shadow-[0_1px_2px_rgba(26,24,21,0.04)] hover:bg-[#F5F4F0]'
                }`}
            >
              Date {sortField === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>

          {/* Card list */}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#E0DBD2] scrollbar-track-transparent">
            <DealsTableView
              filteredDeals={filteredDeals}
              onViewDeal={handleViewDeal}
              onAddMeetingForDeal={handleAddMeeting}
              onEditDeal={d => setEditDeal(d)}
              onDeleteDeal={d => setDeletingDeal(d)}
            />
          </div>
        </div>
      </PageShell>

      {/* Add modal */}
      {showAddModal && (
        <DealModal onClose={() => setShowAddModal(false)} onSave={handleAddDeal} />
      )}

      {/* Edit modal */}
      {editDeal && (
        <DealModal deal={editDeal} onClose={() => setEditDeal(null)} onSave={handleEditDeal} />
      )}

      {/* Delete confirm */}
      {deletingDeal && (
        <DeleteConfirmModal
          company={deletingDeal.company}
          onCancel={() => setDeletingDeal(null)}
          onConfirm={handleConfirmDelete}
          deleting={isDeleting}
        />
      )}

      {/* Add meeting modal */}
      {addMeetingModalDeal && (
        <AddMeetingModal
          deal={addMeetingModalDeal}
          onClose={() => setAddMeetingModalDeal(null)}
        />
      )}
    </>
  )
}

export default DealsPage
