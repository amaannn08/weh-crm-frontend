import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageShell from '../components/PageShell'
import { StatChip } from '../components/PageShell'
import { Newspaper, Printer } from 'lucide-react'
import {
  fetchCompanies, fetchNews, fetchNewsletters,
  fetchIssue, createNewsletter, updateNewsletter, deleteNewsletter,
  addPick, removePick,
  addSegment, updateSegment, deleteSegment,
  renderNewsletter
} from '../api/news'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

const SENTIMENT_STYLE = {
  positive: { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', label: '↑ Positive' },
  negative: { pill: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500', label: '↓ Negative' },
  watch: { pill: 'bg-amber-50 text-amber-900 border-amber-200', dot: 'bg-amber-500', label: '⚠ Watch' },
  neutral: { pill: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: '→ Neutral' },
}

const STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
}

const SEGMENT_TYPES = [
  { value: 'portfolio_highlights', label: 'Portfolio Highlights' },
  { value: 'market_context', label: 'Market Context' },
  { value: 'founder_spotlight', label: 'Founder Spotlight' },
  { value: 'custom', label: 'Custom Block' },
]

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange, pickCount }) {
  const tabs = [
    { id: 'news', label: 'Portfolio News' },
    { id: 'builder', label: pickCount > 0 ? `Builder · ${pickCount}` : 'Builder' },
    { id: 'issues', label: 'Issues' },
    { id: 'preview', label: 'Preview' },
  ]
  return (
    <div className="flex items-center gap-1 border-b border-[#E8E5DE] bg-[#FAFAF8] px-4">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative px-4 py-3 text-[13px] font-medium transition-colors ${active === t.id
              ? 'text-[#FF7102] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FF7102] after:content-[\'\']'
              : 'text-[#9A958E] hover:text-[#1A1815]'
            }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Tab 1: News ───────────────────────────────────────────────────────────────

function NewsTab({ newsItems, loading, pickedIds, onPick, fundFilter, setFundFilter, sentimentFilter, setSentimentFilter, timeRange }) {
  const now = Date.now()
  const dayMap = { '3m': 90, '6m': 180, '12m': 365, 'all': null }
  const days = dayMap[timeRange] ?? 90
  const cutoff = days == null ? null : now - days * 86400000

  const display = useMemo(() => newsItems
    .filter(n => {
      const t = n.published_at ? new Date(n.published_at).getTime() : null
      if (!t) return false
      if (cutoff != null && t < cutoff) return false
      if (fundFilter !== 'all' && n.fund !== fundFilter) return false
      if (sentimentFilter !== 'all' && n.sentiment !== sentimentFilter) return false
      return true
    })
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at)),
    [newsItems, cutoff, fundFilter, sentimentFilter]
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={fundFilter} onChange={setFundFilter}
          options={[['all', 'All Funds'], ['fund1', 'Fund I'], ['fund2', 'Fund II'], ['fund3', 'Fund III']]} />
        <Select value={sentimentFilter} onChange={setSentimentFilter}
          options={[['all', 'All Signals'], ['positive', 'Positive'], ['neutral', 'Neutral'], ['negative', 'Negative'], ['watch', 'Watch']]} />
        <span className="ml-auto text-[11px] text-[#9A958E]">
          {loading ? 'Loading…' : `${display.length} items`}
        </span>
      </div>

      {/* Cards */}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#E8E5DE] bg-white">
        {loading ? (
          <div className="p-6 text-sm text-[#5A5650]">Loading portfolio news…</div>
        ) : display.length === 0 ? (
          <div className="p-6 text-sm text-[#5A5650]">No news items match your filters.</div>
        ) : (
          <div className="divide-y divide-[#E8E5DE]">
            {display.map(n => {
              const picked = pickedIds.has(n.id)
              const ss = SENTIMENT_STYLE[n.sentiment] || SENTIMENT_STYLE.neutral
              return (
                <div key={n.id} className={`flex items-start gap-3 p-4 transition-colors ${picked ? 'bg-orange-50' : 'hover:bg-[#FAFAF8]'}`}>
                  {/* Left dot */}
                  <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${ss.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#1A1815]">{n.company_name || n.company_slug}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${ss.pill}`}>{ss.label}</span>
                      {n.fund && <span className="text-[10px] text-[#9A958E]">{n.fund.replace('fund', 'Fund ')}</span>}
                    </div>
                    <div className="mt-1 text-[13px] font-medium leading-snug text-[#1A1815] line-clamp-2">{n.title}</div>
                    <div className="mt-1 text-[11px] text-[#9A958E]">
                      {fmt(n.published_at)}{n.category ? ` · ${n.category}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    {n.external_url && (
                      <a href={n.external_url} target="_blank" rel="noreferrer"
                        className="rounded-full border border-[#E8E5DE] bg-white px-2.5 py-1 text-[10px] text-[#5A5650] hover:bg-[#F5F4F0]">
                        Open ↗
                      </a>
                    )}
                    <button
                      onClick={() => onPick(n)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${picked
                          ? 'border-[#FF7102] bg-[#FF7102] text-white'
                          : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:border-[#FF7102] hover:text-[#FF7102]'
                        }`}
                    >
                      {picked ? '✓ Picked' : '+ Pick'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 2: Builder ────────────────────────────────────────────────────────────

function BuilderTab({ issue, issueLoading, onRefreshIssue, onRemovePick, onAddSegment, onUpdateSegment, onDeleteSegment, pickedIds }) {
  const [newSegType, setNewSegType] = useState('market_context')
  const [addingSegment, setAddingSegment] = useState(false)
  const [editingSegId, setEditingSegId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [issuePeriod, setIssuePeriod] = useState('')

  useEffect(() => {
    if (issue) {
      setIssueTitle(issue.title || '')
      setIssuePeriod(issue.period_label || '')
    }
  }, [issue?.id])

  if (!issue) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Newspaper className="h-10 w-10 text-[#5A5650] mb-2" />
        <div className="text-[15px] font-semibold text-[#1A1815]">No draft issue yet</div>
        <div className="text-[13px] text-[#9A958E]">Go to <strong>Portfolio News</strong> and click "+ Pick" on any item to start building.</div>
      </div>
    )
  }

  const picks = issue.picks || []
  const segments = issue.segments || []

  function startEdit(seg) {
    setEditingSegId(seg.id)
    setEditTitle(seg.title || '')
    setEditBody(seg.body || '')
  }

  async function saveSegEdit(seg) {
    await onUpdateSegment(seg.id, { title: editTitle, body: editBody })
    setEditingSegId(null)
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* Issue header */}
      <div className="rounded-2xl border border-[#E8E5DE] bg-white p-4">
        <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#9A958E]">Issue Details</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-[#9A958E]">Title</label>
            <IssueField value={issueTitle} onChange={setIssueTitle} onBlur={() => onUpdateSegment && onRefreshIssue({ title: issueTitle })} placeholder="e.g. WEH Weekly Digest" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[#9A958E]">Period Label</label>
            <IssueField value={issuePeriod} onChange={setIssuePeriod} onBlur={() => onRefreshIssue({ period_label: issuePeriod })} placeholder="e.g. March 2026" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[issue.status] || STATUS_STYLE.draft}`}>
            {issue.status}
          </span>
          {issue.status === 'draft' && (
            <button onClick={() => onRefreshIssue({ status: 'in_review' })}
              className="rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100">
              → Submit for Review
            </button>
          )}
          {issue.status === 'in_review' && (
            <button onClick={() => onRefreshIssue({ status: 'published' })}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100">
              → Publish
            </button>
          )}
        </div>
      </div>

      {/* Picks */}
      <div className="rounded-2xl border border-[#E8E5DE] bg-white">
        <div className="flex items-center justify-between border-b border-[#E8E5DE] px-4 py-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9A958E]">Picked Stories — {picks.length}</span>
        </div>
        {picks.length === 0 ? (
          <div className="px-4 py-5 text-[13px] text-[#9A958E]">No items picked yet. Go to the News tab.</div>
        ) : (
          <div className="divide-y divide-[#E8E5DE]">
            {picks.map(p => {
              const ss = SENTIMENT_STYLE[p.sentiment] || SENTIMENT_STYLE.neutral
              return (
                <div key={p.pick_id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${ss.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-[#9A958E]">{p.company_name}</div>
                    <div className="mt-0.5 text-[13px] text-[#1A1815] line-clamp-2">{p.title}</div>
                    <div className="mt-0.5 text-[10px] text-[#9A958E]">{fmt(p.published_at)}</div>
                  </div>
                  <button onClick={() => onRemovePick(p.pick_id)}
                    className="flex-shrink-0 rounded-full border border-[#E8E5DE] px-2.5 py-1 text-[10px] text-[#9A958E] hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Segments */}
      <div className="rounded-2xl border border-[#E8E5DE] bg-white">
        <div className="flex items-center justify-between border-b border-[#E8E5DE] px-4 py-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9A958E]">Segments — {segments.length}</span>
        </div>
        {segments.length === 0 && !addingSegment && (
          <div className="px-4 py-5 text-[13px] text-[#9A958E]">No segments yet.</div>
        )}
        {segments.map(seg => (
          <div key={seg.id} className="border-b border-[#E8E5DE] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9A958E]">
                  {SEGMENT_TYPES.find(s => s.value === seg.segment_type)?.label || seg.segment_type}
                </div>
                {editingSegId === seg.id ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      placeholder="Segment title"
                      className="rounded-xl border border-[#E8E5DE] px-3 py-2 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none" />
                    <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                      placeholder="Body / content..."
                      rows={4}
                      className="rounded-xl border border-[#E8E5DE] px-3 py-2 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => saveSegEdit(seg)}
                        className="rounded-full bg-[#FF7102] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-orange-600">Save</button>
                      <button onClick={() => setEditingSegId(null)}
                        className="rounded-full border border-[#E8E5DE] px-4 py-1.5 text-[12px] text-[#5A5650] hover:bg-[#F5F4F0]">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {seg.title && <div className="mt-1 text-[13px] font-semibold text-[#1A1815]">{seg.title}</div>}
                    {seg.body && <div className="mt-1 text-[12px] text-[#5A5650] line-clamp-3 whitespace-pre-wrap">{seg.body}</div>}
                    {!seg.title && !seg.body && <div className="mt-1 text-[12px] text-[#9A958E] italic">Empty segment — click Edit to add content</div>}
                  </div>
                )}
              </div>
              {editingSegId !== seg.id && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startEdit(seg)}
                    className="rounded-full border border-[#E8E5DE] px-2.5 py-1 text-[10px] text-[#5A5650] hover:bg-[#F5F4F0]">Edit</button>
                  <button onClick={() => onDeleteSegment(seg.id)}
                    className="rounded-full border border-[#E8E5DE] px-2.5 py-1 text-[10px] text-[#9A958E] hover:border-red-200 hover:bg-red-50 hover:text-red-600">✕</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add segment */}
        <div className="p-4">
          {addingSegment ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={newSegType} onChange={setNewSegType}
                options={SEGMENT_TYPES.map(s => [s.value, s.label])} />
              <button onClick={async () => { await onAddSegment(newSegType); setAddingSegment(false) }}
                className="rounded-full bg-[#FF7102] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-orange-600">Add</button>
              <button onClick={() => setAddingSegment(false)}
                className="rounded-full border border-[#E8E5DE] px-4 py-1.5 text-[12px] text-[#5A5650] hover:bg-[#F5F4F0]">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingSegment(true)}
              className="rounded-full border border-dashed border-[#C8C5BE] px-4 py-1.5 text-[12px] text-[#9A958E] hover:border-[#FF7102] hover:text-[#FF7102]">
              + Add a segment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: Issues ─────────────────────────────────────────────────────────────

function IssuesTab({ newsletters, loading, onLoadIssue, onDeleteIssue, currentIssueId, onPublishPreview }) {
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      {/* Create new */}
      <div className="rounded-2xl border border-[#E8E5DE] bg-white p-4">
        {creating ? (
          <div className="flex flex-wrap items-center gap-2">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Issue title, e.g. WEH Weekly — April 2026"
              className="flex-1 min-w-[200px] rounded-xl border border-[#E8E5DE] px-3 py-2 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none" />
            <button onClick={() => { onLoadIssue(null, newTitle); setCreating(false); setNewTitle('') }}
              className="rounded-full bg-[#FF7102] px-4 py-2 text-[12px] font-semibold text-white hover:bg-orange-600">Create</button>
            <button onClick={() => setCreating(false)}
              className="rounded-full border border-[#E8E5DE] px-4 py-2 text-[12px] text-[#5A5650]">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)}
            className="rounded-full border border-dashed border-[#C8C5BE] px-4 py-1.5 text-[12px] text-[#9A958E] hover:border-[#FF7102] hover:text-[#FF7102]">
            + New Issue
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-[#5A5650]">Loading…</div>
      ) : newsletters.length === 0 ? (
        <div className="text-sm text-[#5A5650]">No newsletter issues found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {newsletters.map(i => (
            <div key={i.id} className={`rounded-2xl border bg-white p-4 transition-all ${currentIssueId === i.id ? 'border-[#FF7102] ring-1 ring-[#FF7102]/20' : 'border-[#E8E5DE]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#1A1815] truncate">{i.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[i.status] || STATUS_STYLE.draft}`}>
                      {i.status}
                    </span>
                    {currentIssueId === i.id && (
                      <span className="rounded-full bg-[#FF7102]/10 px-2 py-0.5 text-[10px] font-semibold text-[#FF7102]">Active</span>
                    )}
                  </div>
                  {i.period_label && <div className="mt-0.5 text-[11px] text-[#9A958E]">{i.period_label}</div>}
                  <div className="mt-1 text-[11px] text-[#9A958E]">
                    Stories: {i.pick_count ?? 0} · Segments: {i.segment_count ?? 0}
                    {i.published_at ? ` · Published ${fmt(i.published_at)}` : ` · Created ${fmt(i.created_at)}`}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-1.5">
                  {currentIssueId !== i.id && (
                    <button onClick={() => onLoadIssue(i.id)}
                      className="rounded-full border border-[#E8E5DE] bg-white px-3 py-1 text-[11px] font-medium text-[#5A5650] hover:border-[#FF7102] hover:text-[#FF7102]">
                      Load
                    </button>
                  )}
                  <button onClick={() => onPublishPreview(i.id)}
                    className="rounded-full border border-[#E8E5DE] bg-white px-3 py-1 text-[11px] font-medium text-[#5A5650] hover:bg-[#F5F4F0]">
                    Preview
                  </button>
                  {i.status === 'draft' && (
                    <button onClick={() => onDeleteIssue(i.id)}
                      className="rounded-full border border-[#E8E5DE] px-3 py-1 text-[11px] text-[#9A958E] hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab 4: Preview ────────────────────────────────────────────────────────────

function PreviewTab({ issueId, previewIssueId }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const targetId = previewIssueId || issueId

  useEffect(() => {
    if (!targetId) return
    setLoading(true)
    setError(null)
    renderNewsletter(targetId)
      .then(d => setHtml(d?.html || ''))
      .catch(e => setError(e?.message || 'Failed to render'))
      .finally(() => setLoading(false))
  }, [targetId])

  if (!targetId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Printer className="h-10 w-10 text-[#5A5650] mb-2" />
        <div className="text-[15px] font-semibold text-[#1A1815]">No issue to preview</div>
        <div className="text-[13px] text-[#9A958E]">Load or create an issue in the <strong>Builder</strong> or <strong>Issues</strong> tab first.</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9A958E]">Email Preview</div>
        <button onClick={() => {
          setLoading(true)
          renderNewsletter(targetId).then(d => setHtml(d?.html || '')).catch(e => setError(e?.message)).finally(() => setLoading(false))
        }} className="ml-auto rounded-full border border-[#E8E5DE] px-3 py-1 text-[11px] text-[#5A5650] hover:bg-[#F5F4F0]">
          ↻ Refresh
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#E8E5DE] bg-[#F5F3EE]">
        {loading ? (
          <div className="p-6 text-sm text-[#5A5650]">Rendering…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="p-6 text-sm text-[#9A958E]">Nothing to render yet — add picks to your issue.</div>
        )}
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 text-[12px] text-[#1A1815] focus:border-[#FF7102] focus:outline-none">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function IssueField({ value, onChange, onBlur, placeholder }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
      className="w-full rounded-xl border border-[#E8E5DE] px-3 py-2 text-[13px] text-[#1A1815] focus:border-[#FF7102] focus:outline-none" />
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PortfolioNewsPage() {
  const [timeRange, setTimeRange] = useState('3m')
  const [activeTab, setActiveTab] = useState('news')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newsItems, setNewsItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [newsletters, setNewsletters] = useState([])
  const [fundFilter, setFundFilter] = useState('all')
  const [sentimentFilter, setSentimentFilter] = useState('all')

  // Current draft issue being built
  const [currentIssueId, setCurrentIssueId] = useState(null)
  const [currentIssue, setCurrentIssue] = useState(null)
  const [issueLoading, setIssueLoading] = useState(false)

  // Preview tab: which issue to preview (may differ from currentIssueId)
  const [previewIssueId, setPreviewIssueId] = useState(null)

  // pickedIds: Set of news_item ids in current issue
  const pickedIds = useMemo(() => {
    if (!currentIssue?.picks) return new Set()
    return new Set(currentIssue.picks.map(p => p.news_id))
  }, [currentIssue])

  // pickId lookup: news_item_id → pick_id
  const pickIdMap = useMemo(() => {
    if (!currentIssue?.picks) return {}
    return Object.fromEntries(currentIssue.picks.map(p => [p.news_id, p.pick_id]))
  }, [currentIssue])

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchCompanies(), fetchNews({ sort: 'recent', limit: 200 }), fetchNewsletters()])
      .then(([coRes, newsRes, nlRes]) => {
        if (cancelled) return
        setCompanies(coRes || [])
        setNewsItems(newsRes?.items || [])
        const issues = nlRes || []
        setNewsletters(issues)
        // Auto-load the most recent draft if one exists
        const draft = issues.find(i => i.status === 'draft')
        if (draft) loadIssue(draft.id)
      })
      .catch(e => { if (!cancelled) setError(e?.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ── Load a specific issue ────────────────────────────────────────────────────
  async function loadIssue(id, newTitle) {
    let issueId = id
    if (!issueId && newTitle) {
      // Create a new issue
      const created = await createNewsletter(newTitle)
      issueId = created.id
      setNewsletters(prev => [created, ...prev])
    }
    if (!issueId) return
    setCurrentIssueId(issueId)
    setIssueLoading(true)
    try {
      const issue = await fetchIssue(issueId)
      setCurrentIssue(issue)
    } finally {
      setIssueLoading(false)
    }
    setActiveTab('builder')
  }

  // ── Refresh issue after mutations ────────────────────────────────────────────
  async function refreshIssue(patch) {
    if (!currentIssueId) return
    if (patch && Object.keys(patch).length > 0) {
      await updateNewsletter(currentIssueId, patch)
    }
    const updated = await fetchIssue(currentIssueId)
    setCurrentIssue(updated)
    // Also refresh the issue in newsletters list
    setNewsletters(prev => prev.map(n => n.id === currentIssueId ? { ...n, ...updated } : n))
  }

  // ── Pick / unpick ────────────────────────────────────────────────────────────
  async function handlePick(newsItem) {
    let issueId = currentIssueId

    if (!issueId) {
      // Auto-create a draft issue
      const title = `WEH Digest — ${todayLabel()}`
      const created = await createNewsletter(title)
      issueId = created.id
      setCurrentIssueId(issueId)
      setNewsletters(prev => [created, ...prev])
    }

    if (pickedIds.has(newsItem.id)) {
      // Unpick
      const pid = pickIdMap[newsItem.id]
      if (pid) {
        await removePick(issueId, pid)
        const updated = await fetchIssue(issueId)
        setCurrentIssue(updated)
      }
    } else {
      // Pick
      await addPick(issueId, newsItem.id)
      const updated = await fetchIssue(issueId)
      setCurrentIssue(updated)
    }
  }

  // ── Segment handlers ─────────────────────────────────────────────────────────
  async function handleAddSegment(segType) {
    if (!currentIssueId) return
    await addSegment(currentIssueId, { segment_type: segType })
    const updated = await fetchIssue(currentIssueId)
    setCurrentIssue(updated)
  }

  async function handleUpdateSegment(segId, data) {
    if (!currentIssueId) return
    await updateSegment(currentIssueId, segId, data)
    const updated = await fetchIssue(currentIssueId)
    setCurrentIssue(updated)
  }

  async function handleDeleteSegment(segId) {
    if (!currentIssueId) return
    await deleteSegment(currentIssueId, segId)
    const updated = await fetchIssue(currentIssueId)
    setCurrentIssue(updated)
  }

  // ── Delete issue ─────────────────────────────────────────────────────────────
  async function handleDeleteIssue(id) {
    await deleteNewsletter(id)
    setNewsletters(prev => prev.filter(n => n.id !== id))
    if (currentIssueId === id) {
      setCurrentIssueId(null)
      setCurrentIssue(null)
    }
  }

  // ── Preview from Issues tab ───────────────────────────────────────────────────
  function handlePublishPreview(id) {
    setPreviewIssueId(id)
    setActiveTab('preview')
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalNews: newsItems.length,
    activeCompanies: companies.filter(c => !c.status || c.status === 'active').length,
    pickedCount: pickedIds.size,
    draftIssues: newsletters.filter(n => n.status === 'draft').length,
  }), [newsItems, companies, pickedIds, newsletters])

  return (
    <PageShell
      title="Portfolio News"
      subtitle="Track news, build newsletters, and preview them as email-ready HTML."
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Stat chips */}
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9A958E]">Signals</div>
            <div className="flex flex-wrap gap-2">
              <StatChip label="News tracked" value={loading ? '—' : stats.totalNews} />
              <StatChip label="Portfolio cos" value={loading ? '—' : stats.activeCompanies} />
              <StatChip label="Picked stories" value={loading ? '—' : stats.pickedCount} />
              <StatChip label="Draft issues" value={loading ? '—' : stats.draftIssues} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {/* Tabs */}
        <TabBar active={activeTab} onChange={setActiveTab} pickCount={pickedIds.size} />

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeTab === 'news' && (
            <NewsTab
              newsItems={newsItems}
              loading={loading}
              pickedIds={pickedIds}
              onPick={handlePick}
              fundFilter={fundFilter}
              setFundFilter={setFundFilter}
              sentimentFilter={sentimentFilter}
              setSentimentFilter={setSentimentFilter}
              timeRange={timeRange}
            />
          )}
          {activeTab === 'builder' && (
            <BuilderTab
              issue={currentIssue}
              issueLoading={issueLoading}
              onRefreshIssue={refreshIssue}
              onRemovePick={async (pickId) => {
                await removePick(currentIssueId, pickId)
                const updated = await fetchIssue(currentIssueId)
                setCurrentIssue(updated)
              }}
              onAddSegment={handleAddSegment}
              onUpdateSegment={handleUpdateSegment}
              onDeleteSegment={handleDeleteSegment}
              pickedIds={pickedIds}
            />
          )}
          {activeTab === 'issues' && (
            <IssuesTab
              newsletters={newsletters}
              loading={loading}
              currentIssueId={currentIssueId}
              onLoadIssue={loadIssue}
              onDeleteIssue={handleDeleteIssue}
              onPublishPreview={handlePublishPreview}
            />
          )}
          {activeTab === 'preview' && (
            <PreviewTab
              issueId={currentIssueId}
              previewIssueId={previewIssueId}
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}
