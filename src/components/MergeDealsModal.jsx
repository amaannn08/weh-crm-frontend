import React from 'react'

function DealPreview({ deal, badge }) {
  return (
    <div className="rounded-xl border border-[#E8E5DE] bg-[#FAFAF8] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A1815]">{deal.company}</h3>
        {badge && (
          <span className="rounded-full bg-[#FFEFE2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF7102]">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs text-[#5A5650]">
        <p><span className="text-[#9A958E]">POC:</span> {deal.poc || '—'}</p>
        <p><span className="text-[#9A958E]">Status:</span> {deal.status || '—'}</p>
        <p><span className="text-[#9A958E]">Score:</span> {deal.founder_final_score ?? '—'}</p>
      </div>
    </div>
  )
}

export default function MergeDealsModal({
  primaryDeal,
  secondaryDeals,
  onCancel,
  onConfirm,
  submitting,
  error
}) {
  const totalSelected = 1 + (secondaryDeals?.length || 0)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-[#1A1815]">Merge deals</h2>
        <p className="mt-2 text-sm text-[#5A5650]">
          The newest updated deal is kept automatically as primary. This action is irreversible.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DealPreview deal={primaryDeal} badge="Primary (kept)" />
          {secondaryDeals?.slice(0, 3).map((deal) => (
            <DealPreview key={deal.id} deal={deal} badge="Merged (removed)" />
          ))}
        </div>
        {(secondaryDeals?.length || 0) > 3 && (
          <p className="mt-2 text-xs text-[#9A958E]">
            +{secondaryDeals.length - 3} more selected deals will also be merged.
          </p>
        )}

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-[#E8E5DE] px-4 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-full bg-[#1A1815] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#333] disabled:opacity-60"
          >
            {submitting ? 'Merging…' : `Merge ${totalSelected} deals`}
          </button>
        </div>
      </div>
    </div>
  )
}
