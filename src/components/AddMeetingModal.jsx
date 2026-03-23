import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDealMeeting, fetchDealMeeting, updateDealMeeting } from '../api/meetings'
import { useDealData } from '../context/DealDataContext'
import MeetingNotesEditor from './MeetingNotesEditor'

function formatMeetingDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function AddMeetingModal({ deal, onClose }) {
  const navigate = useNavigate()
  const {
    addMeetingToCache,
    updateMeetingInCache
  } = useDealData()

  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!deal?.id) return
      setLoading(true)
      setError(null)
      try {
        const existing = await fetchDealMeeting(deal.id)
        if (!cancelled) {
          // If no meeting exists yet, keep the form empty but still surface deal POC.
          setMeeting(
            existing ?? {
              poc: deal.poc || '',
              sector: deal.sector || '',
              company: deal.company
            }
          )
        }
      } catch {
        if (!cancelled) setError('Failed to load meeting')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [deal?.id])

  const handleSave = async (patch) => {
    if (!deal?.id) return
    setError(null)
    const meeting_date = formatMeetingDate(deal.meeting_date || deal.date)

    // Backend uses `poc` + `sector` columns on the meeting row.
    const base = {
      meeting_date,
      poc: deal.poc || '',
      sector: deal.sector || '',
      status: patch.status
    }

    const payload = {
      ...base,
      exciting_reason: patch.exciting_reason,
      risks: patch.risks,
      pass_reasons: patch.pass_reasons,
      watch_reasons: patch.watch_reasons,
      action_required: patch.action_required
    }

    if (!meeting?.id) {
      const created = await createDealMeeting(deal.id, payload)
      if (created) {
        addMeetingToCache(created)
        setMeeting(created)
      }
      return
    }

    const updated = await updateDealMeeting(deal.id, {
      exciting_reason: payload.exciting_reason,
      risks: payload.risks,
      pass_reasons: payload.pass_reasons,
      watch_reasons: payload.watch_reasons,
      action_required: payload.action_required,
      status: payload.status
    })

    if (updated) {
      updateMeetingInCache(updated)
      setMeeting(updated)
    }
  }

  const handleAfterSaved = () => {
    onClose()
    navigate(`/meetings/${deal.id}`)
  }

  if (!deal) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#E8E5DE] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1A1815]">
            Add meeting notes — {deal.company}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9A958E] hover:text-[#1A1815] text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center text-sm text-[#5A5650]">
              Loading meeting…
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-lg border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]">
                  {error}
                </div>
              )}

              <MeetingNotesEditor
                dealId={deal.id}
                meeting={meeting}
                title="Meeting details"
                showDelete={false}
                showSave
                onSave={handleSave}
                onSaved={handleAfterSaved}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddMeetingModal

