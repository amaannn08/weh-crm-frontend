import React, { useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Tag chip (role/sector/founded-year pills)
// ---------------------------------------------------------------------------
function TagChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#FFD0AB] bg-[#FFEFE2] px-2.5 py-1 text-[11px] font-medium text-[#FF7102]">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[#FF7102] hover:bg-[#FFD0AB] transition-colors"
          aria-label={`Remove ${label}`}
        >
          ✕
        </button>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Tag input (multi-value)
// ---------------------------------------------------------------------------
function TagInput({ tags, onTagsChange, placeholder }) {
  const [inputVal, setInputVal] = useState('')

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
      e.preventDefault()
      const newTag = inputVal.trim().replace(/,$/, '')
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag])
      }
      setInputVal('')
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-xl border border-[#E8E5DE] bg-white px-3 py-2 focus-within:border-[#FF7102] transition-colors">
      {tags.map((t) => (
        <TagChip key={t} label={t} onRemove={() => onTagsChange(tags.filter((x) => x !== t))} />
      ))}
      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick-start tab definitions
// ---------------------------------------------------------------------------
const QUICK_START_TABS = [
  { id: 'role', emoji: '🎯', label: 'By Role' },
  { id: 'alma', emoji: '🎓', label: 'By Alma Mater' },
  { id: 'lps', emoji: '🏛️', label: 'Find LPs' },
  { id: 'investors', emoji: '🏦', label: 'Find Investors' },
  { id: 'csv', emoji: '📋', label: 'Import CSV' },
  { id: 'lookalikes', emoji: '🖼️', label: 'Find Lookalikes' },
]

const FOUNDED_YEARS = ['2024', '2025', '2023', '2022']

const RESULT_COUNTS = [10, 25, 50, 100]

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function SeedFounderPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('role')
  const [roles, setRoles] = useState(['Co-Founder', 'CEO'])
  const [sectors, setSectors] = useState(['Fintech'])
  const [location, setLocation] = useState('All India')
  const [stage, setStage] = useState('Pre-seed or Seed')
  const [foundedYears, setFoundedYears] = useState(['2024', '2025'])
  const [exportCount, setExportCount] = useState(25)
  const [sliderVal, setSliderVal] = useState(50)
  const [resultCount, setResultCount] = useState(25)
  const [showResultDropdown, setShowResultDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [filters, setFilters] = useState({
    aiScoring: true,
    excludeExisting: true,
    emailEnrichment: false,
    firstConnections: false,
  })

  const toggleYear = (y) => {
    setFoundedYears((prev) =>
      prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
    )
  }

  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSearch = () => {
    setSearching(true)
    // Simulate async search
    setTimeout(() => setSearching(false), 1800)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pb-8">
      {/* ── Hero heading ── */}
      <div className="pt-6 text-center">
        <h1 className="font-serif text-[2.25rem] font-bold leading-tight text-[#1A1815]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          Who should WEH be{' '}
          <span className="italic" style={{ color: '#C85A1A', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            talking to?
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[#5A5650] leading-relaxed">
          Describe who you're looking for — founders, LPs, investors, or anyone else.
          <br />
          Our agent will search LinkedIn and deliver a scored, enriched CSV.
        </p>
      </div>

      {/* ── Search box ── */}
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-[#E8E5DE] bg-white shadow-sm">
          {/* Text input row */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF7102] text-white font-bold text-sm shadow-sm">
              W
            </div>
            <input
              id="seed-founder-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find pre-seed fintech founders from IITs in Bengaluru, founded in 2024 or 2025…"
              className="flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Filter + submit row */}
          <div className="flex items-center justify-between border-t border-[#F0EDE6] px-4 py-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-[#9A958E] hover:text-[#1A1815] transition-colors"
            >
              <span className="text-base">+</span>
              <span>Add filters</span>
            </button>
            <div className="flex items-center gap-2">
              {/* Result count picker */}
              <div className="relative">
                <button
                  id="result-count-btn"
                  type="button"
                  onClick={() => setShowResultDropdown((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs text-[#5A5650] hover:bg-[#F5F4F0] transition-colors"
                >
                  <span className="text-[11px] text-[#9A958E]">Results</span>
                  <span className="font-semibold text-[#FF7102] text-sm">{resultCount}</span>
                  <svg className="h-3 w-3 text-[#9A958E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showResultDropdown && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-24 overflow-hidden rounded-xl border border-[#E8E5DE] bg-white shadow-lg">
                    {RESULT_COUNTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setResultCount(c); setExportCount(c); setShowResultDropdown(false) }}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${c === resultCount ? 'bg-[#FFEFE2] text-[#FF7102] font-semibold' : 'text-[#5A5650] hover:bg-[#F5F4F0]'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Submit */}
              <button
                id="seed-founder-search-btn"
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1815] text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors"
                title="Search"
              >
                {searching ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Start ── */}
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8C3BB] font-mono">
          Quick Start
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#E8E5DE]">
          {QUICK_START_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`quick-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#FF7102] text-[#FF7102]'
                  : 'border-transparent text-[#5A5650] hover:text-[#1A1815]'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <div className="rounded-b-2xl border border-t-0 border-[#E8E5DE] bg-white p-5">
          {activeTab === 'role' && (
            <div>
              <p className="mb-5 text-sm text-[#5A5650] leading-relaxed">
                Search LinkedIn for people holding specific{' '}
                <strong className="text-[#1A1815]">job titles or roles</strong> — founders,
                executives, operators, or anyone else.
              </p>

              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                {/* Role / Title */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                    Role / Title
                  </label>
                  <TagInput tags={roles} onTagsChange={setRoles} placeholder="Add role, press Enter…" />
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E5DE] bg-white px-3 py-2.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239A958E' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
                  >
                    <option>All India</option>
                    <option>Bengaluru</option>
                    <option>Mumbai</option>
                    <option>Delhi NCR</option>
                    <option>Hyderabad</option>
                    <option>Chennai</option>
                    <option>Pune</option>
                  </select>
                </div>

                {/* Sector / Industry */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                    Sector / Industry
                  </label>
                  <TagInput tags={sectors} onTagsChange={setSectors} placeholder="Type sector, press Enter…" />
                </div>

                {/* Company Stage */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                    Company Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E5DE] bg-white px-3 py-2.5 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239A958E' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
                  >
                    <option>Pre-seed or Seed</option>
                    <option>Series A</option>
                    <option>Series B</option>
                    <option>Series C+</option>
                    <option>Any stage</option>
                  </select>
                </div>
              </div>

              {/* Founded In */}
              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                  Founded In
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {FOUNDED_YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => toggleYear(y)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                        foundedYears.includes(y)
                          ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]'
                          : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFoundedYears([])}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                      foundedYears.length === 0
                        ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]'
                        : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'
                    }`}
                  >
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
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFilter(key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      filters[key]
                        ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#C85A1A]'
                        : 'border-[#E8E5DE] bg-white text-[#9A958E] hover:bg-[#F5F4F0]'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${filters[key] ? 'bg-[#FF7102]' : 'bg-[#C8C3BB]'}`}
                    />
                    {label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-[#F0EDE6]" />

              {/* Export row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">
                    Export
                  </span>
                  <span className="text-sm font-bold text-[#1A1815]">{exportCount}</span>
                  <span className="text-xs text-[#9A958E]">profiles</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={exportCount}
                    onChange={(e) => setExportCount(Number(e.target.value))}
                    className="w-28 accent-[#FF7102]"
                  />
                </div>
                <button
                  id="seed-founder-export-btn"
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="flex items-center gap-2 rounded-full bg-[#1A1815] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors"
                >
                  {searching ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Searching…
                    </>
                  ) : (
                    <>
                      🔍 Search &amp; Export CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'role' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 text-4xl">
                {QUICK_START_TABS.find((t) => t.id === activeTab)?.emoji}
              </div>
              <p className="text-sm font-medium text-[#1A1815]">
                {QUICK_START_TABS.find((t) => t.id === activeTab)?.label}
              </p>
              <p className="mt-1 text-xs text-[#9A958E]">Coming soon — this template is being built.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SeedFounderPage
