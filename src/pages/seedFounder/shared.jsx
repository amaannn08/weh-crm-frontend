import React, { useState } from 'react'
import { STATUS_OPTIONS, STATUS_STYLES, STAGE_CLASSES } from './constants.js'

export function scoreDotColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 65) return '#eab308'
  return '#f97316'
}

export function StageBadge({ stage = '' }) {
  const key = stage.toLowerCase().replace(/[\s_]/g, '-')
  const cls = Object.entries(STAGE_CLASSES).find(([k]) => key.includes(k))?.[1]
    ?? 'bg-[#F0EDE6] text-[#5A5650] border-[#E8E5DE]'
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-widest font-mono ${cls}`}>
      {stage.toUpperCase()}
    </span>
  )
}

export function TagChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#FFD0AB] bg-[#FFEFE2] px-2.5 py-1 text-[11px] font-medium text-[#FF7102]">
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove}
          className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[#FF7102] hover:bg-[#FFD0AB] transition-colors">
          ✕
        </button>
      )}
    </span>
  )
}

export function TagInput({ tags, onTagsChange, placeholder }) {
  const [val, setVal] = useState('')
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && val.trim()) {
      e.preventDefault()
      const t = val.trim().replace(/,$/, '')
      if (t && !tags.includes(t)) onTagsChange([...tags, t])
      setVal('')
    } else if (e.key === 'Backspace' && !val && tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    }
  }
  return (
    <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 focus-within:border-[#FF7102] transition-colors">
      {tags.map(t => <TagChip key={t} label={t} onRemove={() => onTagsChange(tags.filter(x => x !== t))} />)}
      <input type="text" value={val} onChange={e => setVal(e.target.value)} onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[100px] flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none" />
    </div>
  )
}

export function StatusSelect({ id, value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(id, e.target.value)}
      onClick={e => e.stopPropagation()}
      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold cursor-pointer focus:outline-none ${STATUS_STYLES[value] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

export function FounderRow({ row, rank, onStatusChange, onDelete, showStatus = true, showDelete = false, selectable = false, selected = false, onToggleSelect }) {
  return (
    <tr className="group border-b border-[#E8E5DE] transition-colors hover:bg-[#FAFAF8]">
      {selectable ? (
        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={e => onToggleSelect(e.target.checked)}
            className="h-4 w-4 rounded border-[#CFCBC2] text-[#FF7102] focus:ring-[#FF7102]" />
        </td>
      ) : (
        <td className="px-3 py-2.5 text-xs font-medium text-[#C8C3BB] font-mono">{rank}</td>
      )}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: scoreDotColor(Number(row.icp_score)) }} />
          <span className="font-semibold text-[#1A1815]">{Math.round(Number(row.icp_score))}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 font-semibold text-[#1A1815]">
        <div className="max-w-[140px] truncate" title={row.name}>{row.name || '—'}</div>
      </td>
      <td className="px-3 py-2.5 text-xs text-[#5A5650]">
        <div className="max-w-[160px] truncate" title={row.title}>{row.title || '—'}</div>
      </td>
      <td className="px-3 py-2.5 text-xs text-[#5A5650]">
        <div className="max-w-[120px] truncate" title={row.company_name}>{row.company_name || '—'}</div>
      </td>
      <td className="px-3 py-2.5"><StageBadge stage={row.stage} /></td>
      <td className="px-3 py-2.5 text-xs text-[#5A5650]">
        <div className="max-w-[90px] truncate" title={row.location}>{row.location || '—'}</div>
      </td>
      <td className="px-3 py-2.5 text-xs text-[#5A5650]">
        <div className="max-w-[90px] truncate" title={row.sector}>{row.sector || '—'}</div>
      </td>
      <td className="px-3 py-2.5">
        {row.linkedin_url
          ? <a href={row.linkedin_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs font-medium text-[#FF7102] hover:underline">View →</a>
          : <span className="text-xs text-[#C8C3BB]">—</span>}
      </td>
      {showStatus && (
        <td className="px-3 py-2.5">
          <StatusSelect id={row.id} value={row.status || 'New'} onChange={onStatusChange} />
        </td>
      )}
      {showDelete && (
        <td className="px-2 py-2.5">
          <button type="button" onClick={e => { e.stopPropagation(); onDelete(row.id) }}
            className="flex h-6 w-6 items-center justify-center rounded text-[#C8C3BB] hover:bg-red-50 hover:text-red-500 transition-colors">
            ✕
          </button>
        </td>
      )}
    </tr>
  )
}

export function FounderTable({ rows, onStatusChange, onDelete, showStatus = true, showDelete = false, selectable = false, selectedIds, onToggleSelect, onToggleAll }) {
  return (
    <table className="min-w-full border-collapse text-sm">
      <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur font-mono">
        <tr>
          {selectable ? (
            <th className="w-8 px-3 py-2.5 text-left">
              <input type="checkbox" checked={selectedIds?.size > 0 && selectedIds?.size === rows.length}
                onChange={e => onToggleAll?.(e.target.checked)}
                className="h-4 w-4 rounded border-[#CFCBC2] text-[#FF7102] focus:ring-[#FF7102]" />
            </th>
          ) : (
            <th className="w-8 px-3 py-2.5 text-left" />
          )}
          <th className="px-3 py-2.5 text-left whitespace-nowrap">ICP</th>
          <th className="px-3 py-2.5 text-left">Name</th>
          <th className="px-3 py-2.5 text-left">Title</th>
          <th className="px-3 py-2.5 text-left">Company</th>
          <th className="px-3 py-2.5 text-left">Stage</th>
          <th className="px-3 py-2.5 text-left">Location</th>
          <th className="px-3 py-2.5 text-left">Sector</th>
          <th className="px-3 py-2.5 text-left">LinkedIn</th>
          {showStatus && <th className="px-3 py-2.5 text-left">Status</th>}
          {showDelete && <th className="px-2 py-2.5 text-left" />}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={showDelete ? 11 : 10} className="px-4 py-10 text-center text-xs text-[#9A958E]">No profiles found.</td></tr>
          : rows.map((row, i) => (
            <FounderRow key={row.id || row.linkedin_id || i} row={row} rank={i + 1}
              onStatusChange={onStatusChange} onDelete={onDelete}
              showStatus={showStatus} showDelete={showDelete}
              selectable={selectable} selected={selectedIds?.has(row.linkedin_id)}
              onToggleSelect={checked => onToggleSelect?.(row.linkedin_id, checked)} />
          ))
        }
      </tbody>
    </table>
  )
}
