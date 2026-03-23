import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealData } from '../context/DealDataContext'

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

function MeetingsTable({ filteredMeetings, onView }) {
  return (
    <div className="min-h-0 h-full overflow-hidden rounded-2xl border border-[#E8E5DE] bg-white shadow-[0_1px_2px_rgba(26,24,21,0.04),0_1px_3px_rgba(26,24,21,0.06)]">
      <div className="h-full overflow-y-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur">
            <tr>
              <th className="px-2 py-2 text-left font-semibold">Company</th>
              <th className="px-2 py-2 text-left font-semibold">POC</th>
              <th className="px-2 py-2 text-left font-semibold">Last meeting</th>
              <th className="px-2 py-2 text-left font-semibold">Status</th>
              <th className="px-2 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeetings.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-xs text-[#9A958E]"
                >
                  No companies match your search.
                </td>
              </tr>
            ) : (
              filteredMeetings.map((meeting) => {
                return (
                  <tr key={meeting.id} className="border-b border-[#E8E5DE] hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-medium text-[#1A1815]">
                        {meeting.company}
                      </div>
                      <div className="text-xs text-[#9A958E]">
                        {meeting.sector || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-[#5A5650]">
                      {meeting.poc || '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-[#5A5650]">
                      {meeting.meeting_date || meeting.date
                        ? formatDate(meeting.meeting_date || meeting.date)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-[#5A5650]">
                      {meeting.status || 'New'}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        onClick={() => onView(meeting.deal_id)}
                        title="View"
                        className="rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-[#5A5650] hover:bg-[#F5F4F0]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 inline-block"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
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
      return (
        company.includes(query) ||
        sector.includes(query) ||
        exciting.includes(query)
      )
    })
  }, [meetings, search])

  if (loading || meetingsLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5A5650]">
        Loading meetings…
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 py-4 overflow-hidden">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold text-[#1A1815]">Meetings</h1>
        <p className="text-xs text-[#9A958E]">
          View and manage meeting notes by company.
        </p>
        <input
          type="text"
          placeholder="Search by company, sector, or notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none"
        />
      </header>

      {error && (
        <div className="rounded-lg border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <MeetingsTable
          filteredMeetings={filteredMeetings}
          onView={(dealId) => navigate(`/meetings/${dealId}`)}
        />
      </div>
    </div>
  )
}

export default MeetingsPage
