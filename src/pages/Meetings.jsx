import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealData } from '../context/DealDataContext'
import PageShell from '../components/PageShell'
import AddMeetingModal from '../components/AddMeetingModal'
import { deleteDealMeeting } from '../api/meetings'

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
// Delete confirm
// ---------------------------------------------------------------------------
function DeleteMeetingConfirmModal({ company, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-[#1A1815]">Delete meeting notes for &quot;{company}&quot;?</h2>
        <p className="mt-2 text-xs text-[#5A5650]">
          This removes the meeting record for this deal. You can add notes again later from the deal.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#E8E5DE] px-4 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Deal picker for &quot;+ Add meeting&quot;
// ---------------------------------------------------------------------------
function DealPickerModal({ deals, onClose, onSelectDeal }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...deals].sort((a, b) => (a.company || '').localeCompare(b.company || ''))
    if (!q) return sorted
    return sorted.filter(
      (d) =>
        (d.company || '').toLowerCase().includes(q) ||
        (d.sector || '').toLowerCase().includes(q)
    )
  }, [deals, query])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[min(480px,85vh)] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E5DE] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1A1815]">Choose a deal</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg leading-none text-[#9A958E] hover:text-[#1A1815]"
          >
            ✕
          </button>
        </div>
        <div className="border-b border-[#E8E5DE] px-5 py-3">
          <input
            type="text"
            autoFocus
            placeholder="Search companies…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-xs text-[#9A958E]">No deals match.</li>
          ) : (
            filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onSelectDeal(d)}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#F5F4F0]"
                >
                  <div className="font-medium text-[#1A1815]">{d.company}</div>
                  {d.sector && <div className="text-xs text-[#9A958E]">{d.sector}</div>}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
const STATUS_BADGE = {
  // ── Current statuses ──────────────────────────────────────────────────────
  'Active Diligence': 'border-[#C6E4D4] bg-[#E8F5EE] text-[#3D7A58]',
  Ghosted:            'border-[#E8E5DE] bg-[#F5F4F0] text-[#5A5650]',
  IC:                 'border-[#C6E4D4] bg-[#3D7A58] text-white',
  'Milestone watch':  'border-[#E8C5A8] bg-[#F5E6D8] text-[#8B4A2E]',
  'Founder watch':    'border-[#E0D9A0] bg-[#F5F0CC] text-[#7A6B1A]',
  Pass:               'border-[#FEE4E2] bg-[#FEF3F2] text-[#B42318]',
  Track:              'border-[#C5D4E8] bg-[#E8EEF7] text-[#3A5F8C]',
  // ── Legacy statuses (existing DB records) ─────────────────────────────────
  Evaluation:         'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]',
  'Working on it':    'border-[#C6E4D4] bg-[#E8F5EE] text-[#3D7A58]',
  New:                'border-[#C5D4E8] bg-[#E8EEF7] text-[#3A5F8C]',
  Active:             'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]',
  Watch:              'border-[#C5D4E8] bg-[#E8EEF7] text-[#3A5F8C]',
  Portfolio:          'border-[#C6E4D4] bg-[#E8F5EE] text-[#3D7A58]',
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-sm text-[#C8C3BB]">—</span>
  const cls = STATUS_BADGE[status] ?? 'border-[#E8E5DE] bg-white text-[#5A5650]'
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

function MeetingsTableRow({ meeting, onView, onAddMeeting, onDelete }) {
  const score = meeting.conviction_score ?? null
  const description = (meeting.exciting_reason || '').trim()

  return (
    <tr className="border-b border-[#E8E5DE] transition-colors hover:bg-[#FAFAF8]">
      <td className="px-4 py-3 align-top">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-[#1A1815]">{meeting.company || '—'}</div>
          <div className="text-xs text-[#9A958E]">{meeting.sector || '—'}</div>
        </div>
      </td>
      <td className="px-4 py-3 align-top text-sm text-[#5A5650]">{meeting.poc || '—'}</td>
      <td className="max-w-[20rem] px-4 py-3 align-top text-sm text-[#5A5650]">
        <div className="line-clamp-2">{description || '—'}</div>
      </td>
      <td className="px-4 py-3 align-top">
        <StatusBadge status={meeting.status} />
      </td>
      <td className="px-4 py-3 align-top text-sm font-medium text-[#1A1815]">
        {score != null && score !== '' ? Number(score).toFixed(1) : '—'}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onAddMeeting}
            title="Add meeting"
            className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0] hover:text-[#FF7102]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h3a1 1 0 100-2H6zm0 4a1 1 0 000 2h6a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onView}
            title="View meeting"
            className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete meeting"
            className="rounded-lg border border-red-100 bg-white p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

function MeetingsTableView({ rows, dealsById, onViewDeal, onAddMeeting, onDeleteMeeting }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">POC</th>
            <th className="px-4 py-3 text-left font-semibold">Description</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Score</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-xs text-neutral-500">
                No meetings match your filters yet.
              </td>
            </tr>
          ) : (
            rows.map((meeting) => {
              const dealForModal =
                dealsById.get(meeting.deal_id) || {
                  id: meeting.deal_id,
                  company: meeting.company,
                  poc: meeting.poc,
                  sector: meeting.sector,
                  meeting_date: meeting.meeting_date,
                  date: meeting.date
                }
              return (
                <MeetingsTableRow
                  key={meeting.id}
                  meeting={meeting}
                  onView={() => onViewDeal(meeting.deal_id)}
                  onAddMeeting={() => onAddMeeting(dealForModal)}
                  onDelete={() => onDeleteMeeting(meeting)}
                />
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function MeetingsPage() {
  const {
    loadDeals,
    loadMeetings,
    deals,
    meetings,
    meetingsLoading,
    removeMeetingFromCache
  } = useDealData()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All sectors')
  const [sortOrder, setSortOrder] = useState('desc')

  const [showDealPicker, setShowDealPicker] = useState(false)
  const [addMeetingModalDeal, setAddMeetingModalDeal] = useState(null)
  const [deletingMeeting, setDeletingMeeting] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([loadDeals(), loadMeetings()])
      } catch (err) {
        console.error(err)
        setError('Failed to load meetings')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [loadDeals, loadMeetings])

  const sectors = useMemo(() => {
    const set = new Set(meetings.map((m) => m.sector).filter(Boolean).map((s) => s.trim()))
    return ['All sectors', ...Array.from(set).sort()]
  }, [meetings])

  const dealsById = useMemo(() => {
    const m = new Map()
    for (const d of deals) m.set(d.id, d)
    return m
  }, [deals])

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase()
    const meetingMatchesSearch = (m, q) => {
      if (!q) return true
      const hay = [
        m.company,
        m.poc,
        m.sector,
        m.exciting_reason,
        m.risks,
        m.action_required,
        m.status,
        m.pass_reasons,
        m.watch_reasons
      ]
      return hay.some((field) => (field || '').toLowerCase().includes(q))
    }

    const filtered = meetings.filter((m) => {
      if (sectorFilter !== 'All sectors' && (m.sector || '').trim() !== sectorFilter) return false
      if (!meetingMatchesSearch(m, query)) return false
      return true
    })

    filtered.sort((a, b) => {
      const da = a.meeting_date || a.date || null
      const db = b.meeting_date || b.date || null
      const ta = da ? new Date(da).getTime() : -Infinity
      const tb = db ? new Date(db).getTime() : -Infinity
      return sortOrder === 'desc' ? tb - ta : ta - tb
    })

    return filtered
  }, [meetings, search, sectorFilter, sortOrder])

  const summaryChips = useMemo(() => {
    const total = filteredMeetings.length
    const scored = filteredMeetings.filter(
      (m) => m.conviction_score != null && m.conviction_score !== ''
    )
    const avg =
      scored.length === 0
        ? '—'
        : (
            scored.reduce((acc, m) => acc + Number(m.conviction_score || 0), 0) / scored.length
          ).toFixed(1)
    const dates = filteredMeetings
      .map((m) => m.meeting_date || m.date)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !Number.isNaN(d.getTime()))
    const latest =
      dates.length === 0 ? null : formatDate(new Date(Math.max(...dates.map((d) => d.getTime()))))
    return { total, avg, latest }
  }, [filteredMeetings])

  const handleViewMeeting = (dealId) => navigate(`/meetings/${dealId}`)

  const handleConfirmDelete = async () => {
    if (!deletingMeeting?.deal_id) return
    setIsDeleting(true)
    try {
      await deleteDealMeeting(deletingMeeting.deal_id)
      removeMeetingFromCache(deletingMeeting.id)
      await loadMeetings(true)
      setDeletingMeeting(null)
    } catch (err) {
      setError(err.message || 'Failed to delete meeting')
    } finally {
      setIsDeleting(false)
    }
  }

  if ((loading || meetingsLoading) && !meetings.length) {
    return (
      <PageShell title="All meetings" subtitle="…">
        <div className="flex h-full items-center justify-center text-sm text-neutral-400">
          Loading meetings…
        </div>
      </PageShell>
    )
  }

  return (
    <>
      <PageShell
        title="All meetings"
        subtitle="View and manage meeting notes by company."
        rightHeaderSlot={
          <div className="flex flex-wrap items-center gap-2">
            {meetings.length > 0 && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
                  <span className="font-semibold text-[#1A1815]">{summaryChips.total}</span>
                  <span>Total meetings</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
                  <span className="font-semibold text-[#1A1815]">{summaryChips.avg}</span>
                  <span>Avg conviction</span>
                </span>
                {summaryChips.latest && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
                    <span className="font-semibold text-[#1A1815]">{summaryChips.latest}</span>
                    <span>Most recent</span>
                  </span>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setShowDealPicker(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add meeting
            </button>
          </div>
        }
      >
        <div className="flex h-full flex-col">
          {error && (
            <div className="mb-2 rounded-lg border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]">
              {error}
            </div>
          )}

          <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 pb-2 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search company, POC, notes, status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none"
              />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="max-w-[160px] rounded-xl border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Sort by meeting date"
                onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FF7102] bg-[#FFEFE2] px-3 py-2 text-xs font-medium text-[#FF7102] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h3a1 1 0 100-2H6zm0 4a1 1 0 000 2h6a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Date {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>

          <MeetingsTableView
            rows={filteredMeetings}
            dealsById={dealsById}
            onViewDeal={handleViewMeeting}
            onAddMeeting={(deal) => setAddMeetingModalDeal(deal)}
            onDeleteMeeting={(m) => setDeletingMeeting(m)}
          />
        </div>
      </PageShell>

      {showDealPicker && (
        <DealPickerModal
          deals={deals}
          onClose={() => setShowDealPicker(false)}
          onSelectDeal={(deal) => {
            setShowDealPicker(false)
            setAddMeetingModalDeal(deal)
          }}
        />
      )}

      {addMeetingModalDeal && (
        <AddMeetingModal deal={addMeetingModalDeal} onClose={() => setAddMeetingModalDeal(null)} />
      )}

      {deletingMeeting && (
        <DeleteMeetingConfirmModal
          company={deletingMeeting.company || 'Company'}
          onCancel={() => setDeletingMeeting(null)}
          onConfirm={handleConfirmDelete}
          deleting={isDeleting}
        />
      )}
    </>
  )
}

export default MeetingsPage
