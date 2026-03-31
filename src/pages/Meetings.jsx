import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealData } from '../context/DealDataContext'

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_COLORS = {
  Pass: { dot: '#B42318', pill: 'bg-[#FEF3F2] text-[#B42318]' },
  Portfolio: { dot: '#3D7A58', pill: 'bg-[#E8F5EE] text-[#3D7A58]' },
  'Active Diligence': { dot: '#FF7102', pill: 'bg-[#FFEFE2] text-[#FF7102]' },
  Watch: { dot: '#3A5F8C', pill: 'bg-[#E8EEF7] text-[#3A5F8C]' },
  New: { dot: '#3A5F8C', pill: 'bg-[#E8EEF7] text-[#3A5F8C]' },
  Active: { dot: '#FF7102', pill: 'bg-[#FFEFE2] text-[#FF7102]' },
  Evaluation: { dot: '#9A6B3F', pill: 'bg-[#FBF2EA] text-[#9A6B3F]' },
}

function getStatusStyle(status) {
  return STATUS_COLORS[status] || { dot: '#9A958E', pill: 'bg-[#F5F4F0] text-[#5A5650]' }
}

function StatChip({ label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#E8E5DE] bg-white px-4 py-1.5 shadow-[0_1px_2px_rgba(26,24,21,0.04)]">
      <span className="text-[13px] font-semibold text-[#1A1815]">{value}</span>
      <span className="text-[11px] text-[#9A958E] font-mono">{label}</span>
    </div>
  )
}

function MeetingCard({ meeting, onView }) {
  const date = formatDate(meeting.meeting_date || meeting.date)
  const status = meeting.status || 'New'
  const { dot, pill } = getStatusStyle(status)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(meeting.deal_id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(meeting.deal_id) } }}
      className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-[#E8E5DE] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(26,24,21,0.04),0_1px_3px_rgba(26,24,21,0.06)] transition-all hover:border-[#D4CFC4] hover:shadow-[0_4px_12px_rgba(26,24,21,0.10)]"
    >
      {/* Status dot */}
      <span
        className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />

      {/* Company + sector */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-[#1A1815]">
          {meeting.company || '—'}
        </div>
        {meeting.sector && (
          <div className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#C8C3BB]">
            {meeting.sector}
          </div>
        )}
      </div>

      {/* POC — fixed width column */}
      <div className="hidden w-32 shrink-0 items-center gap-1.5 sm:flex">
        {meeting.poc ? (
          <>
            <svg className="h-3 w-3 shrink-0 text-[#C8C3BB]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="truncate text-[12px] text-[#5A5650]">{meeting.poc}</span>
          </>
        ) : (
          <span className="text-[12px] text-[#C8C3BB]">—</span>
        )}
      </div>

      {/* Date — fixed width column */}
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

      {/* Status pill — fixed width column, centred */}
      <div className="w-32 shrink-0 flex justify-end">
        <span className={`inline-flex items-center justify-center rounded-[4px] px-2 py-0.5 text-[9px] font-mono font-medium uppercase tracking-[0.10em] whitespace-nowrap ${pill}`}>
          {status}
        </span>
      </div>

      {/* Arrow */}
      <span className="shrink-0 text-[#C8C3BB] transition-colors group-hover:text-[#FF7102]">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F4F0] text-3xl">
        📅
      </div>
      <p className="text-[14px] font-semibold text-[#1A1815]">No meetings found</p>
      <p className="mt-1 text-[12px] text-[#9A958E]">Try a different search term</p>
    </div>
  )
}

function MeetingsPage() {
  const { loadDeals, loadMeetings, meetings, meetingsLoading } = useDealData()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

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

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return meetings
    return meetings.filter((m) => {
      const company = (m.company || '').toLowerCase()
      const sector = (m.sector || '').toLowerCase()
      const exciting = (m.exciting_reason || '').toLowerCase()
      const poc = (m.poc || '').toLowerCase()
      return company.includes(query) || sector.includes(query) || exciting.includes(query) || poc.includes(query)
    })
  }, [meetings, search])

  // Stats
  const totalMeetings = meetings.length
  const uniqueSectors = useMemo(() => new Set(meetings.map(m => m.sector).filter(Boolean)).size, [meetings])
  const latestDate = useMemo(() => {
    const dates = meetings.map(m => m.meeting_date || m.date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))
    if (!dates.length) return null
    return formatDate(new Date(Math.max(...dates)))
  }, [meetings])

  if (loading || meetingsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8E5DE] border-t-[#FF7102]" />
          <span className="text-[12px] font-mono text-[#9A958E]">Loading meetings…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Header — matches PageShell / Deals exactly */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">Meetings</h1>
          <p className="text-xs text-slate-500">View and manage meeting notes by company.</p>
        </div>
        {/* Stat chips on the right, matching deals header-right pattern */}
        {meetings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <StatChip value={totalMeetings} label="meetings" />
            {uniqueSectors > 0 && <StatChip value={uniqueSectors} label="sectors" />}
            {latestDate && <StatChip value={latestDate} label="most recent" />}
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]">
          {error}
        </div>
      )}

      {/* Filter bar — same style as Deals */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 shadow-[0_1px_2px_rgba(26,24,21,0.04)] focus-within:border-[#FF7102] transition-colors">
          <svg className="h-3.5 w-3.5 shrink-0 text-[#C8C3BB]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387-1.414 1.414-4.387-4.387zM8 14A6 6 0 108 2a6 6 0 000 12z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search by company, sector, POC, or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-transparent text-[13px] text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-[#C8C3BB] hover:text-[#5A5650] transition-colors">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Card list */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#E0DBD2] scrollbar-track-transparent">
        {filteredMeetings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 pb-4">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onView={(dealId) => navigate(`/meetings/${dealId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MeetingsPage

