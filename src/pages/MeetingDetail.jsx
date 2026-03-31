import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DealDetailContent } from './DealDetail'
import { useDealData } from '../context/DealDataContext'
import MeetingNotesEditor from '../components/MeetingNotesEditor'

function MeetingDetailPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const { loadDeals, loadMeetings, meetings, meetingsLoading } = useDealData()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([loadDeals(), loadMeetings()])
      } catch {
        if (!cancelled) setError('Failed to load meeting details')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [loadDeals, loadMeetings])

  const meeting = useMemo(() => {
    if (!dealId) return null
    return meetings.find((m) => String(m.deal_id) === String(dealId)) ?? null
  }, [meetings, dealId])

  if (loading || meetingsLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5A5650]">
        Loading meeting…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-600">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => navigate('/meetings')}
          className="rounded-full border border-[#E8E5DE] bg-white px-3 py-1 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0]"
        >
          ← Back to meetings
        </button>
      </div>
    )
  }

  if (!dealId) return null

  return (
    <DealDetailContent dealId={dealId} onBack={() => navigate('/meetings')} backLabel="← Back to meetings">
      <div className="rounded-2xl border border-[#E8E5DE] bg-white px-6 py-5 shadow-[0_1px_2px_rgba(26,24,21,0.04),0_1px_3px_rgba(26,24,21,0.06)]">
        <MeetingNotesEditor
          dealId={dealId}
          meeting={meeting}
          title={meeting?.company || 'Meeting details'}
          showDelete
          showSave
          onDeleted={() => navigate('/meetings')}
        />
      </div>
    </DealDetailContent>
  )
}

export default MeetingDetailPage

