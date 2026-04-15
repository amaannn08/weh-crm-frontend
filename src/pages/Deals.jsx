import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealData } from '../context/DealDataContext'
import PageShell from '../components/PageShell'
import {
  createDeal,
  deleteDeal,
  fetchPendingDealAmbiguities,
  fetchPendingDealAmbiguitiesCount,
  ingestTranscript,
  mergeDeals,
  resolveDealAmbiguity,
  updateDeal
} from '../api/deals'
import AddMeetingModal from '../components/AddMeetingModal'
import MergeDealsModal from '../components/MergeDealsModal'
import DealAmbiguityModal from '../components/DealAmbiguityModal'
import { Plus, Upload, Loader2, CalendarPlus, Edit2, Trash2, ArrowDownWideNarrow, ArrowUpNarrowWide, CalendarDays } from 'lucide-react'

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
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      'Active Diligence',
      'Ghosted',
      'IC',
      'Milestone watch',
      'Founder watch',
      'Pass',
      'Track'
    ]
  },
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
    isEdit ? { ...deal } : { status: 'Active Diligence' }
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
// Table row
// ---------------------------------------------------------------------------
function DealsTableRow({ deal, selected, onToggleSelect, onView, onAddMeeting, onEdit, onDelete }) {
  const lastMeeting = deal.meeting_date || deal.date || null
  const score = deal.founder_final_score ?? null
  const description = (deal.business_model || deal.sector || '').trim()

  return (
    <tr
      onClick={onView}
      className="border-b border-[#E8E5DE] hover:bg-[#FAFAF8] transition-colors cursor-pointer"
    >
      <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          aria-label={`Select ${deal.company} for merge`}
          className="h-4 w-4 rounded border-[#CFCBC2] text-[#FF7102] focus:ring-[#FF7102]"
        />
      </td>
      <td className="px-4 py-3 align-top">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-[#1A1815]">{deal.company}</div>
          <div className="text-xs text-[#9A958E]">
            {deal.sector || deal.business_model || '—'}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top text-sm text-[#5A5650]">
        {deal.poc || '—'}
      </td>
      <td className="px-4 py-3 align-top text-sm text-[#5A5650]">
        {lastMeeting ? formatDate(lastMeeting) : '—'}
      </td>
      <td className="px-4 py-3 align-top text-sm font-medium text-[#1A1815]">
        {score != null ? Number(score).toFixed(1) : '—'}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex justify-end items-center gap-1">
          {/* Add meeting */}
          <button type="button" onClick={(e) => { e.stopPropagation(); onAddMeeting(); }} title="Add meeting"
            className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0] hover:text-[#FF7102]">
            <CalendarPlus className="h-3.5 w-3.5" />
          </button>
          {/* Edit */}
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit deal"
            className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0]">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          {/* Delete */}
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete deal"
            className="rounded-lg border border-red-100 bg-white p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function DealsTableView({
  filteredDeals,
  selectedDealIds,
  onToggleAll,
  onToggleDeal,
  onViewDeal,
  onAddMeetingForDeal,
  onEditDeal,
  onDeleteDeal
}) {
  const allSelected = filteredDeals.length > 0 && filteredDeals.every((deal) => selectedDealIds.has(String(deal.id)))
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="Select all filtered deals for merge"
                className="h-4 w-4 rounded border-[#CFCBC2] text-[#FF7102] focus:ring-[#FF7102]"
              />
            </th>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">POC</th>
            <th className="px-4 py-3 text-left font-semibold">Last meeting</th>
            <th className="px-4 py-3 text-left font-semibold">Score</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDeals.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-xs text-neutral-500">
                No deals match your filters yet.
              </td>
            </tr>
          ) : (
            filteredDeals.map((deal) => (
              <DealsTableRow
                key={deal.id}
                deal={deal}
                selected={selectedDealIds.has(String(deal.id))}
                onToggleSelect={(checked) => onToggleDeal(deal.id, checked)}
                onView={() => onViewDeal(deal)}
                onAddMeeting={() => onAddMeetingForDeal(deal)}
                onEdit={() => onEditDeal(deal)}
                onDelete={() => onDeleteDeal(deal)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function DealsPage() {
  const navigate = useNavigate()
  const {
    deals,
    loadDeals,
    loadMeetings,
    dealsLoading,
    updateDealInCache,
    meetings,
    removeMeetingFromCache
  } = useDealData()
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
  const [selectedDealIds, setSelectedDealIds] = useState(() => new Set())
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [mergeError, setMergeError] = useState(null)
  const [mergeStatus, setMergeStatus] = useState(null)
  const [isMerging, setIsMerging] = useState(false)
  const [ambiguityCount, setAmbiguityCount] = useState(0)
  const [ambiguityModalOpen, setAmbiguityModalOpen] = useState(false)
  const [ambiguityLoading, setAmbiguityLoading] = useState(false)
  const [ambiguityError, setAmbiguityError] = useState(null)
  const [ambiguityItems, setAmbiguityItems] = useState([])
  const [processingAmbiguityId, setProcessingAmbiguityId] = useState(null)

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
    Promise.all([loadDeals(), loadMeetings()]).catch(() => setError('Failed to load deals'))
  }, [loadDeals, loadMeetings])

  const refreshAmbiguityCount = async () => {
    const data = await fetchPendingDealAmbiguitiesCount()
    setAmbiguityCount(Number(data?.count || 0))
  }

  const loadAmbiguities = async () => {
    setAmbiguityLoading(true)
    setAmbiguityError(null)
    try {
      const data = await fetchPendingDealAmbiguities()
      setAmbiguityItems(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setAmbiguityError(err.message || 'Failed to load ambiguities')
    } finally {
      setAmbiguityLoading(false)
    }
  }

  useEffect(() => {
    refreshAmbiguityCount().catch(() => {})
  }, [])

  const meetingByDealId = useMemo(() => {
    const m = new Map()
    for (const mt of meetings) {
      if (mt.deal_id != null) m.set(String(mt.deal_id), mt)
    }
    return m
  }, [meetings])

  const industries = useMemo(() => {
    const sectors = new Set(
      deals.map((d) => d.sector).filter(Boolean).map((s) => s.trim())
    )
    return ['All industries', ...Array.from(sectors)]
  }, [deals])

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase()
    const min = Number(minScore) || 0

    const dealMatchesSearch = (deal, q) => {
      if (!q) return true
      const meeting = meetingByDealId.get(deal.id != null ? String(deal.id) : '')
      const hay = [
        deal.company,
        deal.poc,
        deal.sector,
        deal.business_model,
        deal.exciting_reason,
        deal.founder_name,
        deal.company_domain,
        deal.stage,
        deal.status,
        deal.risks,
        deal.action_required,
        deal.dd_recommendation,
        deal.pass_reasons,
        deal.watch_reasons,
        deal.risk_level,
        deal.source_file_name,
        meeting?.exciting_reason,
        meeting?.risks,
        meeting?.action_required,
        meeting?.status,
        meeting?.pass_reasons,
        meeting?.watch_reasons,
        meeting?.poc,
        meeting?.sector
      ]
      return hay.some((field) => String(field ?? '').toLowerCase().includes(q))
    }

    const filtered = deals.filter((deal) => {
      if (query && !dealMatchesSearch(deal, query)) return false
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
  }, [deals, meetingByDealId, industryFilter, minScore, search, sortField, sortOrder])

  const selectedDeals = useMemo(
    () => deals.filter((deal) => selectedDealIds.has(String(deal.id))),
    [deals, selectedDealIds]
  )

  const mergePreview = useMemo(() => {
    if (selectedDeals.length < 2) return null
    const sorted = [...selectedDeals].sort((a, b) => {
      const getDate = (deal) => new Date(deal?.updated_at || deal?.created_at || 0).getTime()
      return getDate(b) - getDate(a)
    })
    return { primary: sorted[0], secondaryDeals: sorted.slice(1) }
  }, [selectedDeals])

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

  const handleToggleDeal = (dealId, checked) => {
    const key = String(dealId)
    setSelectedDealIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const handleToggleAllFiltered = (checked) => {
    setSelectedDealIds((prev) => {
      const next = new Set(prev)
      for (const deal of filteredDeals) {
        const key = String(deal.id)
        if (checked) next.add(key)
        else next.delete(key)
      }
      return next
    })
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

  const handleOpenMergeModal = () => {
    setMergeError(null)
    setMergeModalOpen(true)
  }

  const handleOpenAmbiguityModal = async () => {
    setAmbiguityModalOpen(true)
    await loadAmbiguities()
  }

  const handleResolveAmbiguityMerge = async (ambiguityId, dealId) => {
    setProcessingAmbiguityId(ambiguityId)
    try {
      await resolveDealAmbiguity(ambiguityId, { action: 'merge_into_existing', dealId })
      await Promise.all([loadDeals(true), loadMeetings(true), refreshAmbiguityCount(), loadAmbiguities()])
    } catch (err) {
      setAmbiguityError(err.message || 'Failed to resolve ambiguity')
    } finally {
      setProcessingAmbiguityId(null)
    }
  }

  const handleIgnoreAmbiguity = async (ambiguityId) => {
    setProcessingAmbiguityId(ambiguityId)
    try {
      await resolveDealAmbiguity(ambiguityId, { action: 'ignore' })
      await Promise.all([refreshAmbiguityCount(), loadAmbiguities()])
    } catch (err) {
      setAmbiguityError(err.message || 'Failed to ignore ambiguity')
    } finally {
      setProcessingAmbiguityId(null)
    }
  }

  const handleConfirmMerge = async () => {
    if (selectedDeals.length < 2) return
    setIsMerging(true)
    setMergeError(null)
    try {
      const summary = await mergeDeals(selectedDeals.map((deal) => deal.id))
      await Promise.all([loadDeals(true), loadMeetings(true)])
      setSelectedDealIds(new Set())
      setMergeModalOpen(false)
      setMergeStatus({
        ok: true,
        message: `Merged ${summary.mergedDealIds?.length || 0} deal(s) into "${summary.primaryCompany}".`
      })
    } catch (err) {
      setMergeError(err.message || 'Failed to merge deals')
    } finally {
      setIsMerging(false)
    }
  }

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

              <Plus className="h-3 w-3" />
              Add deal
            </button>

            <button
              type="button"
              onClick={handleOpenMergeModal}
              disabled={selectedDeals.length < 2 || isMerging}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1815] shadow-sm hover:bg-[#F5F4F0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Merge deals ({selectedDeals.length} selected)
            </button>

            <button
              type="button"
              onClick={handleOpenAmbiguityModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1815] shadow-sm hover:bg-[#F5F4F0]"
            >
              Ambiguities ({ambiguityCount})
            </button>

            {/* Upload transcript */}
            <button type="button" onClick={handleUploadClick} disabled={ingesting}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1815] shadow-sm hover:bg-[#F5F4F0] disabled:opacity-60">
              {ingesting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Ingesting…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload transcript
                </>
              )}
            </button>

            {uploadStatus && (
              <span className={`text-xs font-medium ${uploadStatus.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {uploadStatus.message}
              </span>
            )}
            {mergeStatus && (
              <span className={`text-xs font-medium ${mergeStatus.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {mergeStatus.message}
              </span>
            )}
          </div>
        }
      >
        <div className="flex h-full flex-col">
          {/* Filter bar */}
          <div className="border-b border-[#E8E5DE] px-3 pb-2 pt-2 bg-[#FAFAF8]">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search company, POC, sector, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-xs text-[#9A958E]">Min score</span>
                <input
                  type="number" min="0" max="10" step="0.5"
                  value={minScore} onChange={(e) => setMinScore(e.target.value)}
                  className="w-16 rounded-xl border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
                />
              </div>
              <select
                value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}
                className="rounded-xl border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none max-w-[140px]"
              >
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {/* Score sort */}
              <button
                type="button"
                onClick={() => handleSort('score')}
                title="Sort by founder score"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${sortField === 'score'
                  ? 'border-[#FF7102] bg-[#FFEFE2] text-[#FF7102]'
                  : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'
                  }`}
              >
                {(sortField !== 'score' || sortOrder === 'desc') ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
                Score {sortField === 'score' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>

              {/* Date sort */}
              <button
                type="button"
                onClick={() => handleSort('date')}
                title="Sort by meeting date"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${sortField === 'date'
                  ? 'border-[#FF7102] bg-[#FFEFE2] text-[#FF7102]'
                  : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'
                  }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Date {sortField === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>
            </div>
          </div>

          <DealsTableView
            filteredDeals={filteredDeals}
            selectedDealIds={selectedDealIds}
            onToggleAll={handleToggleAllFiltered}
            onToggleDeal={handleToggleDeal}
            onViewDeal={handleViewDeal}
            onAddMeetingForDeal={handleAddMeeting}
            onEditDeal={d => setEditDeal(d)}
            onDeleteDeal={d => setDeletingDeal(d)}
          />
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

      {mergeModalOpen && mergePreview && (
        <MergeDealsModal
          primaryDeal={mergePreview.primary}
          secondaryDeals={mergePreview.secondaryDeals}
          error={mergeError}
          submitting={isMerging}
          onCancel={() => {
            setMergeModalOpen(false)
            setMergeError(null)
          }}
          onConfirm={handleConfirmMerge}
        />
      )}

      <DealAmbiguityModal
        open={ambiguityModalOpen}
        items={ambiguityItems}
        loading={ambiguityLoading}
        error={ambiguityError}
        processingId={processingAmbiguityId}
        onClose={() => setAmbiguityModalOpen(false)}
        onResolveMerge={handleResolveAmbiguityMerge}
        onIgnore={handleIgnoreAmbiguity}
      />
    </>
  )
}

export default DealsPage