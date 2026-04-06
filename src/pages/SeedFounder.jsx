import React, { useState, useMemo } from 'react'
import PageShell from '../components/PageShell'
import { ChevronDown, Loader2, ArrowUp, Search, ArrowDownWideNarrow, ArrowUpNarrowWide, Target, GraduationCap, Landmark, PiggyBank, FileSpreadsheet, Image as ImageIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const ALL_RESULTS = [
  { rank: 1,  score: 91, name: 'Ayush Agrawal',  title: 'Co-Founder & CEO',  company: 'Lumafly',      stage: 'SEED',     location: 'Bengaluru, KA',  alma: 'IIT Ropar' },
  { rank: 2,  score: 88, name: 'Priya Nambiar',  title: 'Founder',           company: 'GreenLedger',  stage: 'PRE-SEED', location: 'Mumbai, MH',     alma: 'IIM Ahmedabad' },
  { rank: 3,  score: 85, name: 'Rhea Kapoor',    title: 'Founder & CTO',     company: 'Mango Health', stage: 'PRE-SEED', location: 'Hyderabad, TS',  alma: 'AIIMS Delhi' },
  { rank: 4,  score: 85, name: 'Nisha Arora',    title: 'Founder',           company: 'EduBridge AI', stage: 'PRE-SEED', location: 'Delhi NCR',      alma: 'BITS Pilani' },
  { rank: 5,  score: 83, name: 'Mihir Shah',     title: 'Co-Founder',        company: 'CarbonTrace',  stage: 'SEED',     location: 'Ahmedabad, GJ',  alma: 'IIT Bombay' },
  { rank: 6,  score: 80, name: 'Tarun Bose',     title: 'Co-Founder & CTO',  company: 'LogIQ',        stage: 'SEED',     location: 'Kolkata, WB',    alma: 'IIT Kharagpur' },
  { rank: 7,  score: 79, name: 'Ananya Seth',    title: 'CEO & Founder',     company: 'Pariksha AI',  stage: 'PRE-SEED', location: 'Bengaluru, KA',  alma: 'IIT Delhi' },
  { rank: 8,  score: 78, name: 'Rohan Iyer',     title: 'Co-Founder',        company: 'MedSync',      stage: 'SEED',     location: 'Chennai, TN',    alma: 'IIM Bangalore' },
  { rank: 9,  score: 77, name: 'Sakshi Gupta',   title: 'Founder',           company: 'MediData',     stage: 'STEALTH',  location: 'Pune, MH',       alma: 'AIIMS Mumbai' },
  { rank: 10, score: 74, name: 'Karan Mehta',    title: 'Co-Founder',        company: 'Stackd',       stage: 'SEED',     location: 'Delhi NCR',      alma: 'NIT Trichy' },
  { rank: 11, score: 71, name: 'Vani Krishnan',  title: 'Founder',           company: 'PayHarvest',   stage: 'PRE-SEED', location: 'Bengaluru, KA',  alma: 'IIM Bangalore' },
  { rank: 12, score: 70, name: 'Shiv Raman',     title: 'Co-Founder',        company: 'FieldOS',      stage: 'STEALTH',  location: 'Bengaluru, KA',  alma: 'IIT Kharagpur' },
  { rank: 13, score: 68, name: 'Divya Pillai',   title: 'Founder & CEO',     company: 'CraftStack',   stage: 'PRE-SEED', location: 'Mumbai, MH',     alma: 'MICA Ahmedabad' },
  { rank: 14, score: 66, name: 'Arjun Malhotra', title: 'Co-Founder',        company: 'AgriPulse',    stage: 'SEED',     location: 'Chandigarh, PB', alma: 'PAU Ludhiana' },
  { rank: 15, score: 63, name: 'Sneha Reddy',    title: 'Founder',           company: 'SkillBridge',  stage: 'PRE-SEED', location: 'Hyderabad, TS',  alma: 'BITS Hyderabad' },
  { rank: 16, score: 61, name: 'Dev Agarwal',    title: 'Co-Founder & CTO',  company: 'FleetMind',    stage: 'SEED',     location: 'Bengaluru, KA',  alma: 'IIT Madras' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function scoreDotColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 65) return '#eab308'
  return '#f97316'
}

const STAGE_CLASSES = {
  SEED:       'bg-[#FFF3E0] text-[#C85A1A] border-[#FFD0AB]',
  'PRE-SEED': 'bg-[#FEF3F2] text-[#9A4C00] border-[#FFD0AB]',
  STEALTH:    'bg-[#F0EDE6] text-[#5A5650] border-[#E8E5DE]',
}

function StageBadge({ stage }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-widest font-mono ${STAGE_CLASSES[stage] ?? 'bg-[#F0EDE6] text-[#5A5650] border-[#E8E5DE]'}`}>
      {stage}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Tag chip
// ---------------------------------------------------------------------------
function TagChip({ label, onRemove }) {
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

// ---------------------------------------------------------------------------
// Tag input
// ---------------------------------------------------------------------------
function TagInput({ tags, onTagsChange, placeholder }) {
  const [inputVal, setInputVal] = useState('')
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
      e.preventDefault()
      const t = inputVal.trim().replace(/,$/, '')
      if (t && !tags.includes(t)) onTagsChange([...tags, t])
      setInputVal('')
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    }
  }
  return (
    <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 focus-within:border-[#FF7102] transition-colors">
      {tags.map((t) => <TagChip key={t} label={t} onRemove={() => onTagsChange(tags.filter(x => x !== t))} />)}
      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[100px] flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FOUNDED_YEARS = ['2026','2024', '2025', '2023', '2022']
const RESULT_COUNTS = [10, 25, 50, 100]
const QUICK_START_TABS = [
  { id: 'role',       icon: Target,          label: 'By Role' },
  { id: 'alma',       icon: GraduationCap,   label: 'By Alma Mater' },
  { id: 'lps',        icon: Landmark,        label: 'Find LPs' },
  { id: 'investors',  icon: PiggyBank,       label: 'Find Investors' },
  { id: 'csv',        icon: FileSpreadsheet, label: 'Import CSV' },
  { id: 'lookalikes', icon: ImageIcon,       label: 'Find Lookalikes' },
]

// ---------------------------------------------------------------------------
// Search form (full-page, initial view)
// ---------------------------------------------------------------------------
function SearchForm({ onSearch }) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('role')
  const [roles, setRoles] = useState(['Co-Founder', 'CEO'])
  const [sectors, setSectors] = useState(['Fintech'])
  const [location, setLocation] = useState('All India')
  const [stage, setStage] = useState('Pre-seed or Seed')
  const [foundedYears, setFoundedYears] = useState(['2024', '2025'])
  const [exportCount, setExportCount] = useState(25)
  const [resultCount, setResultCount] = useState(25)
  const [showCountDropdown, setShowCountDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [filters, setFilters] = useState({
    aiScoring: true, excludeExisting: true, emailEnrichment: false, firstConnections: false,
  })

  const toggleYear = (y) => setFoundedYears(p => p.includes(y) ? p.filter(x => x !== y) : [...p, y])
  const toggleFilter = (k) => setFilters(p => ({ ...p, [k]: !p[k] }))

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      setSearching(false)
      onSearch()
    }, 1400)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pb-8">

      {/* ── Hero heading ── */}
      <div className="pt-6 text-center">
        <h1 className="text-[2.25rem] font-bold leading-tight text-[#1A1815]"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          Who should WEH be{' '}
          <span className="italic" style={{ color: '#C85A1A' }}>talking to?</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[#5A5650] leading-relaxed">
          Describe who you're looking for — founders, LPs, investors, or anyone else.
          <br />
          Our agent will search LinkedIn and deliver a scored, enriched list.
        </p>
      </div>

      {/* ── NLP search box ── */}
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-[#E8E5DE] bg-white shadow-sm">
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF7102] text-white font-bold text-sm shadow-sm">
              W
            </div>
            <input
              id="seed-founder-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Find pre-seed fintech founders from IITs in Bengaluru, founded in 2024 or 2025…"
              className="flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none"
            />
          </div>

          {/* Filter + submit row */}
          <div className="flex items-center justify-between border-t border-[#F0EDE6] px-4 py-3">
            <button type="button" className="flex items-center gap-1.5 text-sm text-[#9A958E] hover:text-[#1A1815] transition-colors">
              <span className="text-base">+</span>
              <span>Add filters</span>
            </button>
            <div className="flex items-center gap-2">
              {/* Result count */}
              <div className="relative">
                <button id="result-count-btn" type="button" onClick={() => setShowCountDropdown(v => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs text-[#5A5650] hover:bg-[#F5F4F0] transition-colors">
                  <span className="text-[11px] text-[#9A958E]">Results</span>
                  <span className="font-semibold text-[#FF7102] text-sm">{resultCount}</span>
                  <ChevronDown className="h-3 w-3 text-[#9A958E]" />
                </button>
                {showCountDropdown && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-20 overflow-hidden rounded-xl border border-[#E8E5DE] bg-white shadow-lg">
                    {RESULT_COUNTS.map(c => (
                      <button key={c} type="button"
                        onClick={() => { setResultCount(c); setExportCount(c); setShowCountDropdown(false) }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${c === resultCount ? 'bg-[#FFEFE2] text-[#FF7102] font-semibold' : 'text-[#5A5650] hover:bg-[#F5F4F0]'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Arrow submit */}
              <button id="seed-founder-search-btn" type="button" onClick={handleSearch} disabled={searching}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1815] text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors" title="Search">
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Start ── */}
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8C3BB] font-mono">
          Quick Start
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#E8E5DE]">
          {QUICK_START_TABS.map(tab => (
            <button key={tab.id} type="button" id={`quick-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-[#FF7102] text-[#FF7102]' : 'border-transparent text-[#5A5650] hover:text-[#1A1815]'}`}>
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="rounded-b-2xl border border-t-0 border-[#E8E5DE] bg-white p-5">
          {activeTab === 'role' ? (
            <div>
              <p className="mb-5 text-sm text-[#5A5650] leading-relaxed">
                Search LinkedIn for people holding specific{' '}
                <strong className="text-[#1A1815]">job titles or roles</strong> — founders, executives, operators, or anyone else.
              </p>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                {/* Role */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Role / Title</label>
                  <TagInput tags={roles} onTagsChange={setRoles} placeholder="Add role, press Enter…" />
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Location</label>
                  <div className="relative">
                    <select value={location} onChange={(e) => setLocation(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#E8E5DE] bg-white px-3 py-2.5 pr-8 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none">
                      {['All India','Bengaluru','Mumbai','Delhi NCR','Hyderabad','Chennai','Pune'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A958E]" />
                  </div>
                </div>

                {/* Sector */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Sector / Industry</label>
                  <TagInput tags={sectors} onTagsChange={setSectors} placeholder="Type sector, press Enter…" />
                </div>

                {/* Stage */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Company Stage</label>
                  <div className="relative">
                    <select value={stage} onChange={(e) => setStage(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#E8E5DE] bg-white px-3 py-2.5 pr-8 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none">
                      {['Pre-seed or Seed','Series A','Series B','Series C+','Any stage'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A958E]" />
                  </div>
                </div>
              </div>

              {/* Founded In */}
              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Founded In</label>
                <div className="flex flex-wrap items-center gap-2">
                  {FOUNDED_YEARS.map(y => (
                    <button key={y} type="button" onClick={() => toggleYear(y)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${foundedYears.includes(y) ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]' : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'}`}>
                      {y}
                    </button>
                  ))}
                  <button type="button" onClick={() => setFoundedYears([])}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${foundedYears.length === 0 ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]' : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'}`}>
                    Any
                  </button>
                </div>
              </div>

              {/* Toggle filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: 'aiScoring', label: 'AI ICP Scoring' },
                  { key: 'excludeExisting', label: 'Exclude existing contacts' },
                  { key: 'emailEnrichment', label: 'Email enrichment' },
                  { key: 'firstConnections', label: '1st connections first' },
                ].map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => toggleFilter(key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filters[key] ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#C85A1A]' : 'border-[#E8E5DE] bg-white text-[#9A958E] hover:bg-[#F5F4F0]'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${filters[key] ? 'bg-[#FF7102]' : 'bg-[#C8C3BB]'}`} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-[#F0EDE6]" />

              {/* Export / Search row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Export</span>
                  <span className="text-sm font-bold text-[#1A1815]">{exportCount}</span>
                  <span className="text-xs text-[#9A958E]">profiles</span>
                  <input type="range" min={10} max={100} step={5} value={exportCount}
                    onChange={(e) => setExportCount(Number(e.target.value))}
                    className="w-28 accent-[#FF7102]" />
                </div>
                <button id="seed-founder-export-btn" type="button" onClick={handleSearch} disabled={searching}
                  className="flex items-center gap-2 rounded-full bg-[#1A1815] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors">
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </>
                  ) : <>🔍 Search &amp; View</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              {(() => { const Icon = QUICK_START_TABS.find(t => t.id === activeTab)?.icon; return Icon ? <div className="mb-3 flex justify-center text-[#FF7102]"><Icon className="h-8 w-8" /></div> : null })()}
              <p className="text-sm font-medium text-[#1A1815]">{QUICK_START_TABS.find(t => t.id === activeTab)?.label}</p>
              <p className="mt-1 text-xs text-[#9A958E]">Coming soon — this template is being built.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results table row
// ---------------------------------------------------------------------------
function ResultRow({ row }) {
  return (
    <tr className="group border-b border-[#E8E5DE] transition-colors hover:bg-[#FAFAF8] cursor-pointer">
      <td className="px-4 py-3 text-xs font-medium text-[#C8C3BB] font-mono">{row.rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: scoreDotColor(row.score) }} />
          <span className="font-semibold text-[#1A1815]">{row.score}</span>
          <span className="text-[#C8C3BB] group-hover:text-[#9A958E] transition-colors">›</span>
        </div>
      </td>
      <td className="px-4 py-3 font-semibold text-[#1A1815]">{row.name}</td>
      <td className="px-4 py-3 text-sm text-[#5A5650]">{row.title}</td>
      <td className="px-4 py-3 text-sm text-[#5A5650]">{row.company}</td>
      <td className="px-4 py-3"><StageBadge stage={row.stage} /></td>
      <td className="px-4 py-3 text-sm text-[#5A5650]">{row.location}</td>
      <td className="px-4 py-3 text-sm text-[#5A5650]">{row.alma}</td>
    </tr>
  )
}

function ResultsTableView({ rows }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 border-b border-[#E8E5DE] bg-[#FAFAF8]/95 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A958E] backdrop-blur font-mono">
          <tr>
            <th className="w-10 px-4 py-3 text-left" />
            <th className="px-4 py-3 text-left">ICP Score</th>
            <th className="px-4 py-3 text-left">Full Name</th>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Company</th>
            <th className="px-4 py-3 text-left">Stage</th>
            <th className="px-4 py-3 text-left">Location</th>
            <th className="px-4 py-3 text-left">Alma Mater</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-xs text-neutral-500">
                No profiles match your filters.
              </td>
            </tr>
          ) : (
            rows.map(row => <ResultRow key={row.rank} row={row} />)
          )}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results view — wrapped in PageShell matching Meetings/Deals layout
// ---------------------------------------------------------------------------
function ResultsView({ onNewSearch }) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All stages')
  const [sortDir, setSortDir] = useState('desc')

  const stages = useMemo(() => {
    const s = new Set(ALL_RESULTS.map(r => r.stage))
    return ['All stages', ...Array.from(s)]
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = ALL_RESULTS.filter(r => {
      if (stageFilter !== 'All stages' && r.stage !== stageFilter) return false
      if (q) {
        const hay = [r.name, r.title, r.company, r.location, r.alma].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    return [...rows].sort((a, b) => sortDir === 'desc' ? b.score - a.score : a.score - b.score)
  }, [search, stageFilter, sortDir])

  const avgScore = useMemo(() => {
    if (!filteredRows.length) return '—'
    return (filteredRows.reduce((acc, r) => acc + r.score, 0) / filteredRows.length).toFixed(1)
  }, [filteredRows])

  return (
    <PageShell
      title="Seed Founders"
      subtitle="Scored and enriched founder profiles matching your ICP criteria."
      rightHeaderSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            <span className="font-semibold text-[#1A1815]">{filteredRows.length}</span>
            <span>Profiles found</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-[11px] font-medium text-[#5A5650] shadow-sm">
            <span className="font-semibold text-[#1A1815]">{avgScore}</span>
            <span>Avg ICP score</span>
          </span>
          <button type="button" onClick={onNewSearch}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1815] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333] transition-colors">
            <Search className="h-3 w-3" />
            New search
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {/* Filter bar — same pattern as Meetings / Deals */}
        <div className="border-b border-[#E8E5DE] bg-[#FAFAF8] px-3 pb-2 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search name, company, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:border-[#FF7102] focus:outline-none"
            />
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-xl border border-[#E8E5DE] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none">
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FF7102] bg-[#FFEFE2] px-3 py-2 text-xs font-medium text-[#FF7102] transition-colors">
              {(sortDir === 'desc') ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
              Score {sortDir === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {/* Table */}
        <ResultsTableView rows={filteredRows} />
      </div>
    </PageShell>
  )
}

// ---------------------------------------------------------------------------
// Root — switches between search form and results
// ---------------------------------------------------------------------------
function SeedFounderPage() {
  const [showResults, setShowResults] = useState(false)

  if (showResults) {
    return <ResultsView onNewSearch={() => setShowResults(false)} />
  }

  return <SearchForm onSearch={() => setShowResults(true)} />
}

export default SeedFounderPage
