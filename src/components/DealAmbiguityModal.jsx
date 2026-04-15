import React from 'react'

function CandidateRow({ deal, onPick, disabled }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E8E5DE] bg-white px-3 py-2">
      <div>
        <p className="text-sm font-medium text-[#1A1815]">{deal.company}</p>
        <p className="text-xs text-[#9A958E]">{deal.company_domain || 'No domain'}</p>
      </div>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        className="rounded-full border border-[#E8E5DE] px-3 py-1 text-xs font-medium text-[#1A1815] hover:bg-[#F5F4F0] disabled:opacity-60"
      >
        Merge into this
      </button>
    </div>
  )
}

export default function DealAmbiguityModal({
  open,
  items,
  loading,
  error,
  processingId,
  onClose,
  onResolveMerge,
  onIgnore
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E5DE] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1A1815]">Ambiguous company matches</h2>
          <button type="button" onClick={onClose} className="text-[#9A958E] hover:text-[#1A1815]">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading && <p className="text-sm text-[#5A5650]">Loading pending ambiguities…</p>}
          {!loading && error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-[#5A5650]">No pending ambiguities.</p>
          )}
          {!loading && !error && items.map((item) => {
            const busy = processingId === item.id
            const pendingDeal = item.pendingDeal
            return (
              <div key={item.id} className="mb-4 rounded-xl border border-[#E8E5DE] bg-[#FAFAF8] p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1A1815]">{item.extracted_company || 'Unknown company'}</p>
                    <p className="text-xs text-[#9A958E]">Domain: {item.extracted_domain || 'None found'}</p>
                    {pendingDeal && (
                      <p className="text-xs text-[#9A958E]">Pending deal: {pendingDeal.company}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onIgnore(item.id)}
                    disabled={busy}
                    className="rounded-full border border-[#E8E5DE] bg-white px-3 py-1 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] disabled:opacity-60"
                  >
                    Ignore
                  </button>
                </div>
                <div className="space-y-2">
                  {item.candidateDeals.map((candidate) => (
                    <CandidateRow
                      key={candidate.id}
                      deal={candidate}
                      disabled={busy}
                      onPick={() => onResolveMerge(item.id, candidate.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
