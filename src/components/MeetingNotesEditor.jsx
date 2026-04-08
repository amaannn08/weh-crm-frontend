import React, { useEffect, useMemo, useState } from 'react'
import { deleteDealMeeting, updateDealMeeting } from '../api/meetings'
import { useDealData } from '../context/DealDataContext'
import { User, CalendarDays, Sparkles, AlertTriangle, Ban, Eye, Zap } from 'lucide-react'

const STATUS_OPTIONS = [
  'Active Diligence',
  'Ghosted',
  'IC',
  'Milestone watch',
  'Founder watch',
  'Pass',
  'Track',
]

const STATUS_STYLES = {
  'Active Diligence': 'border-[#C6E4D4] bg-[#E8F5EE] text-[#3D7A58]',
  Ghosted:            'border-[#E8E5DE] bg-[#F5F4F0] text-[#5A5650]',
  IC:                 'border-[#C6E4D4] bg-[#3D7A58] text-white',
  'Milestone watch':  'border-[#E8C5A8] bg-[#F5E6D8] text-[#8B4A2E]',
  'Founder watch':    'border-[#E0D9A0] bg-[#F5F0CC] text-[#7A6B1A]',
  Pass:               'border-[#FEE4E2] bg-[#FEF3F2] text-[#B42318]',
  Track:              'border-[#C5D4E8] bg-[#E8EEF7] text-[#3A5F8C]',
}

const STATUS_ACTIVE = {
  'Active Diligence': 'bg-[#3D7A58] text-white border-[#3D7A58]',
  Ghosted:            'bg-[#5A5650] text-white border-[#5A5650]',
  IC:                 'bg-[#2A5A40] text-white border-[#2A5A40]',
  'Milestone watch':  'bg-[#8B4A2E] text-white border-[#8B4A2E]',
  'Founder watch':    'bg-[#7A6B1A] text-white border-[#7A6B1A]',
  Pass:               'bg-[#B42318] text-white border-[#B42318]',
  Track:              'bg-[#3A5F8C] text-white border-[#3A5F8C]',
}

function getStatusStyle(status, isActive) {
  if (isActive) return STATUS_ACTIVE[status] || 'bg-[#1A1815] text-white border-[#1A1815]'
  return STATUS_STYLES[status] || 'border-[#E8E5DE] bg-white text-[#5A5650]'
}

function formatMeetingDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function NoteSection({ icon: Icon, label, accent, field, value, onChange, rows = 4, placeholder }) {
  const accentBorder = {
    orange: 'border-l-[#FF7102]',
    red: 'border-l-[#B42318]',
    blue: 'border-l-[#3A5F8C]',
    green: 'border-l-[#3D7A58]',
    amber: 'border-l-[#9A6B3F]',
  }[accent] || 'border-l-[#E8E5DE]'

  return (
    <div className={`rounded-xl border border-[#E8E5DE] border-l-[3px] ${accentBorder} bg-white shadow-[0_1px_2px_rgba(26,24,21,0.04)] overflow-hidden`}>
      <div className="flex items-center gap-2 border-b border-[#F0EDE8] px-4 py-2.5">
        {Icon && <Icon className="h-3.5 w-3.5 stroke-[2px]" />}
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#9A958E]">
          {label}
        </span>
      </div>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-4 py-3 text-[13px] leading-relaxed text-[#1A1815] placeholder:italic placeholder:text-[#C8C3BB] focus:outline-none"
      />
    </div>
  )
}

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
  const { meetings, updateMeetingInCache, removeMeetingFromCache } = useDealData()

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
    status: 'Active Diligence'
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      exciting_reason: effectiveMeeting?.exciting_reason || '',
      risks: effectiveMeeting?.risks || '',
      pass_reasons: effectiveMeeting?.pass_reasons || '',
      watch_reasons: effectiveMeeting?.watch_reasons || '',
      action_required: effectiveMeeting?.action_required || '',
      status: effectiveMeeting?.status || 'Active Diligence'
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
      if (updateDealInCache) {
        updateDealInCache({ id: dealId, ...patch })
      }
      if (onSaved) await onSaved(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
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
    const confirmed = window.confirm('Delete this meeting? This will not delete the underlying deal.')
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

  const date = formatMeetingDate(effectiveMeeting?.meeting_date || effectiveMeeting?.date)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#FF7102]">Meeting notes</p>
          <h2 className="mt-0.5 text-[17px] font-semibold text-[#1A1815]">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {effectiveMeeting?.poc && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#9A958E]">
                <User className="h-3 w-3" />
                {effectiveMeeting.poc}
              </span>
            )}
            {date && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#9A958E]">
                <CalendarDays className="h-3 w-3" />
                {date}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          {showDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-[#FEE4E2] bg-[#FEF3F2] px-3.5 py-1.5 text-[11px] font-semibold text-[#B42318] transition-colors hover:bg-[#FEE4E2] disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          {showSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-60 ${saved
                  ? 'bg-[#3D7A58] text-white'
                  : 'bg-[#1A1815] text-white hover:bg-[#2d2a26]'
                }`}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-[11px] text-[#B42318]">
          {error}
        </div>
      )}

      {/* Status pills */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#9A958E]">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, status: opt }))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${getStatusStyle(opt, form.status === opt)}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Note sections */}
      <NoteSection
        icon={Sparkles}
        label="Why is this exciting?"
        accent="orange"
        field="exciting_reason"
        value={form.exciting_reason}
        onChange={handleChange('exciting_reason')}
        rows={4}
        placeholder="What stood out in this meeting? What makes this opportunity compelling…"
      />

      <NoteSection
        icon={AlertTriangle}
        label="Risks"
        accent="red"
        field="risks"
        value={form.risks}
        onChange={handleChange('risks')}
        rows={4}
        placeholder="Key risks identified — market, team, traction, competition…"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <NoteSection
          icon={Ban}
          label="Reasons to pass"
          accent="red"
          field="pass_reasons"
          value={form.pass_reasons}
          onChange={handleChange('pass_reasons')}
          rows={3}
          placeholder="Why we might pass…"
        />
        <NoteSection
          icon={Eye}
          label="Reasons to watch"
          accent="blue"
          field="watch_reasons"
          value={form.watch_reasons}
          onChange={handleChange('watch_reasons')}
          rows={3}
          placeholder="What to monitor…"
        />
        <NoteSection
          icon={Zap}
          label="Action required"
          accent="amber"
          field="action_required"
          value={form.action_required}
          onChange={handleChange('action_required')}
          rows={3}
          placeholder="Next steps and follow-ups…"
        />
      </div>
    </div>
  )
}

export default MeetingNotesEditor
