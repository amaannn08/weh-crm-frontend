import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealData } from '../context/DealDataContext'

function StatCard({ label, value, sub, color, emoji, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${color}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-current opacity-60">
                    {label}
                </span>
                <span className="text-xl">{emoji}</span>
            </div>
            <div className="mt-3">
                <div className="text-4xl font-bold tabular-nums">{value}</div>
                {sub && (
                    <div className="mt-1 text-[11px] font-medium opacity-60">{sub}</div>
                )}
            </div>
        </button>
    )
}

function ActivityRow({ company, status, score, sector, meetingDate }) {
    const navigate = useNavigate()
    const statusColor =
        status === 'Active Diligence' ? 'bg-[#FFEFE2] text-[#FF7102]'
            : status === 'Watch' ? 'bg-[#FFF8EC] text-[#92560A]'
                : 'bg-[#E8EEF7] text-[#3A5F8C]'

    const formattedDate = meetingDate
        ? new Date(meetingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null

    return (
        <button
            type="button"
            onClick={() => navigate('/deals')}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[#F5F4F0] transition-colors"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-[8px] bg-[#EEECE7] flex items-center justify-center text-sm font-bold text-[#9A958E]">
                    {(company || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#1A1815]">{company}</div>
                    {sector && <div className="text-[11px] text-[#9A958E] truncate">{sector}</div>}
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
                {formattedDate && (
                    <span className="text-[11px] font-mono text-[#9A958E] whitespace-nowrap">
                        📅 {formattedDate}
                    </span>
                )}
                <span className={`inline-flex items-center rounded-[4px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] font-mono ${statusColor}`}>
                    {status || 'New'}
                </span>
                {score != null && (
                    <span className="text-[11px] font-mono font-medium text-[#9A958E] w-7 text-right">
                        {Number(score).toFixed(1)}
                    </span>
                )}
            </div>
        </button>
    )
}

function Dashboard() {
    const navigate = useNavigate()
    const { deals, meetings } = useDealData()

    const stats = useMemo(() => {
        const total = deals.length
        const portfolio = deals.filter(d => d.status === 'Portfolio').length
        const active = deals.filter(d => d.status === 'Active Diligence').length
        const pass = deals.filter(d => d.status === 'Pass').length
        const watch = deals.filter(d => d.status === 'Watch').length
        const scored = deals.filter(d => d.founder_final_score != null && d.founder_final_score !== '')
        const avgScore = scored.length
            ? (scored.reduce((a, d) => a + Number(d.founder_final_score), 0) / scored.length).toFixed(1)
            : '—'
        return { total, portfolio, active, pass, watch, avgScore, totalMeetings: meetings.length }
    }, [deals, meetings])

    // Under-evaluation statuses (exclude Portfolio and Pass)
    const UNDER_EVAL = new Set(['New', 'Active Diligence', 'Watch'])

    // Build a map from deal_id → most recent meeting date so we can show it per row
    const meetingDateByDeal = useMemo(() => {
        const map = {}
        for (const m of meetings) {
            const date = m.meeting_date || m.date
            if (!date || !m.deal_id) continue
            const existing = map[m.deal_id]
            if (!existing || new Date(date) > new Date(existing)) {
                map[m.deal_id] = date
            }
        }
        return map
    }, [meetings])

    // Under-evaluation deals sorted by most recent meeting date (newest first)
    const evalDeals = useMemo(() =>
        deals
            .filter(d => UNDER_EVAL.has(d.status))
            .sort((a, b) => {
                const da = meetingDateByDeal[a.id] || a.meeting_date || a.date
                const db = meetingDateByDeal[b.id] || b.meeting_date || b.date
                const ta = da ? new Date(da).getTime() : -Infinity
                const tb = db ? new Date(db).getTime() : -Infinity
                return tb - ta // newest first
            })
            .slice(0, 8),
        [deals, meetingDateByDeal]
    )

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden py-5 px-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[#1A1815]">Dashboard</h1>
                <p className="mt-0.5 text-xs text-[#9A958E]">WEH venture CRM — pipeline at a glance</p>
            </div>

            {/* Stat cards grid */}
            <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <StatCard
                    label="Total deals"
                    value={stats.total}
                    sub="Across all stages"
                    emoji="📊"
                    color="bg-white border-[#E8E5DE] text-[#1A1815]"
                    onClick={() => navigate('/deals')}
                />
                <StatCard
                    label="Total meetings"
                    value={stats.totalMeetings}
                    sub="Deal meetings logged"
                    emoji="📅"
                    color="bg-white border-[#E8E5DE] text-[#1A1815]"
                    onClick={() => navigate('/meetings')}
                />
                <StatCard
                    label="Portfolio"
                    value={stats.portfolio}
                    sub="Invested"
                    emoji="🏆"
                    color="bg-[#E8F5EE] border-[#B8DEC9] text-[#3D7A58]"
                    onClick={() => navigate('/deals')}
                />
                <StatCard
                    label="Active"
                    value={stats.active}
                    sub="In diligence"
                    emoji="🔍"
                    color="bg-[#FFEFE2] border-[#FFD0AB] text-[#FF7102]"
                    onClick={() => navigate('/deals')}
                />
                <StatCard
                    label="Pass"
                    value={stats.pass}
                    sub="Not pursued"
                    emoji="❌"
                    color="bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]"
                    onClick={() => navigate('/deals')}
                />
                <StatCard
                    label="Avg score"
                    value={stats.avgScore}
                    sub={`${deals.filter(d => d.founder_final_score != null).length} scored`}
                    emoji="⭐"
                    color="bg-[#FAFAF8] border-[#E8E5DE] text-[#1A1815]"
                    onClick={() => navigate('/deals')}
                />
            </div>

            {/* Under-evaluation deals sorted by most recent meeting */}
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#E8E5DE] bg-white overflow-hidden">
                <div className="border-b border-[#E8E5DE] px-5 py-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                        Recent meetings — under evaluation
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate('/deals')}
                        className="text-[11px] font-medium text-[#FF7102] hover:underline"
                    >
                        View all →
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[#F5F4F0] px-2 py-1">
                    {evalDeals.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-[#C8C3BB]">No deals under evaluation yet.</p>
                    ) : (
                        evalDeals.map(deal => (
                            <ActivityRow
                                key={deal.id}
                                company={deal.company}
                                status={deal.status}
                                score={deal.founder_final_score}
                                sector={deal.sector}
                                meetingDate={meetingDateByDeal[deal.id] || deal.meeting_date || deal.date}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
