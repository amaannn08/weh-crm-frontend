import React, { useEffect, useMemo, useState } from 'react'
import { deleteDealMeeting, updateDealMeeting } from '../api/meetings'
import { useDealData } from '../context/DealDataContext'

const STATUS_OPTIONS = ['New', 'Active', 'Evaluation', 'Pass', 'Watch', 'Portfolio']

function MeetingNotesEditor({
  dealId,
  meeting,
  title = 'Meeting notes',
  showDelete = false,
  showSave = true,
  onSave,
  onDelete,
  onSaved,
  onDeleted
}) {
  const {
    meetings,
    updateMeetingInCache,
    removeMeetingFromCache
  } = useDealData()

  const meetingFromContext = useMemo(() => {
    if (!dealId) return null
    return meetings.find((m) => m.deal_id === dealId) ?? null
  }, [meetings, dealId])

  const effectiveMeeting = meeting ?? meetingFromContext

  const [form, setForm] = useState({
    exciting_reason: '',
    risks: '',
    pass_reasons: '',
    watch_reasons: '',
    action_required: '',
    status: 'New'
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setForm({
      exciting_reason: effectiveMeeting?.exciting_reason || '',
      risks: effectiveMeeting?.risks || '',
      pass_reasons: effectiveMeeting?.pass_reasons || '',
      watch_reasons: effectiveMeeting?.watch_reasons || '',
      action_required: effectiveMeeting?.action_required || '',
      status: effectiveMeeting?.status || 'New'
    })
  }, [
    effectiveMeeting?.id,
    effectiveMeeting?.deal_id,
    effectiveMeeting?.status,
    effectiveMeeting?.exciting_reason,
    effectiveMeeting?.risks,
    effectiveMeeting?.pass_reasons,
    effectiveMeeting?.watch_reasons,
    effectiveMeeting?.action_required
  ])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleDefaultSave = async () => {
    if (!dealId) return
    setSaving(true)
    setError(null)
    try {
      const patch = {
        exciting_reason: form.exciting_reason || null,
        risks: form.risks || null,
        pass_reasons: form.pass_reasons || null,
        watch_reasons: form.watch_reasons || null,
        action_required: form.action_required || null,
        status: form.status || null
      }
      const updated = await updateDealMeeting(dealId, patch)
      updateMeetingInCache(updated)
      if (onSaved) await onSaved(updated)
    } catch {
      setError('Failed to save meeting notes')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!showSave) return
    if (onSave) {
      setSaving(true)
      setError(null)
      try {
        const patch = {
          exciting_reason: form.exciting_reason || null,
          risks: form.risks || null,
          pass_reasons: form.pass_reasons || null,
          watch_reasons: form.watch_reasons || null,
          action_required: form.action_required || null,
          status: form.status || null
        }
        await onSave(patch)
        if (onSaved) await onSaved()
      } catch {
        setError('Failed to save meeting notes')
      } finally {
        setSaving(false)
      }
      return
    }
    await handleDefaultSave()
  }

  const handleDefaultDelete = async () => {
    if (!dealId) return
    const confirmed = window.confirm(
      'Delete this meeting? This will not delete the underlying deal.'
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    try {
      await deleteDealMeeting(dealId)
      const toRemove = meetings.find((m) => m.deal_id === dealId)
      if (toRemove) removeMeetingFromCache(toRemove.id)
      if (onDeleted) await onDeleted()
    } catch {
      setError('Failed to delete meeting')
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    if (onDelete) {
      setDeleting(true)
      setError(null)
      try {
        await onDelete()
        if (onDeleted) await onDeleted()
      } catch {
        setError('Failed to delete meeting')
      } finally {
        setDeleting(false)
      }
      return
    }
    await handleDefaultDelete()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#1A1815]">{title}</h2>
          {effectiveMeeting?.poc && (
            <p className="mt-1 text-[11px] text-[#9A958E]">
              POC: {effectiveMeeting.poc}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-1 text-xs font-medium text-[#B42318] hover:bg-[#FEE4E2] disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          {showSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[#1A1815] px-3 py-1 text-xs font-medium text-white hover:bg-[#2d2a26] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#9A958E]">
            Status
          </label>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="w-full rounded-lg border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#9A958E]">
            Why is this exciting?
          </label>
          <textarea
            value={form.exciting_reason}
            onChange={handleChange('exciting_reason')}
            rows={4}
            className="w-full rounded-lg border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#9A958E]">
          Risks
        </label>
        <textarea
          value={form.risks}
          onChange={handleChange('risks')}
          rows={4}
          className="w-full rounded-lg border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#9A958E]">
            Reasons for pass
          </label>
          <textarea
            value={form.pass_reasons}
            onChange={handleChange('pass_reasons')}
            rows={3}
            className="w-full rounded-lg border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#9A958E]">
            Reasons to watch
          </label>
          <textarea
            value={form.watch_reasons}
            onChange={handleChange('watch_reasons')}
            rows={3}
            className="w-full rounded-lg border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#9A958E]">
            Action required
          </label>
          <textarea
            value={form.action_required}
            onChange={handleChange('action_required')}
            rows={3}
            className="w-full rounded-lg border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

export default MeetingNotesEditor

