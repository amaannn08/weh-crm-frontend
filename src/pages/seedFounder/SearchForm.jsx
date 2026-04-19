import React, { useState } from 'react'
import { ChevronDown, Loader2, RefreshCw, ArrowUp, Target, GraduationCap, Landmark, PiggyBank, FileSpreadsheet, Image as ImageIcon } from 'lucide-react'
import { PRESETS, FOUNDED_YEARS } from './constants.js'
import { TagInput } from './shared.jsx'
import { searchFounders } from '../../api/seedFounders'
import PageShell from '../../components/PageShell'

const RESULT_COUNTS = [10, 25, 50, 100]
const QUICK_START_TABS = [
  { id: 'role',       icon: Target,          label: 'By Role' },
  { id: 'alma',       icon: GraduationCap,   label: 'By Alma Mater' },
  { id: 'lps',        icon: Landmark,        label: 'Find LPs' },
  { id: 'investors',  icon: PiggyBank,       label: 'Find Investors' },
  { id: 'csv',        icon: FileSpreadsheet, label: 'Import CSV' },
  { id: 'lookalikes', icon: ImageIcon,       label: 'Find Lookalikes' },
]

export default function SearchForm({ onSearchComplete, onViewSaved }) {
  const [activeTab, setActiveTab]         = useState('role')
  const [query, setQuery]               = useState('')
  const [sectors, setSectors]           = useState(['Fintech'])
  const [backgrounds, setBackgrounds]   = useState([])
  const [location, setLocation]         = useState('All India')
  const [stage, setStage]               = useState('Pre-seed or Seed')
  const [foundedYears, setFoundedYears] = useState(['2024', '2025'])
  const [exportCount, setExportCount]   = useState(25)
  const [resultCount, setResultCount]   = useState(25)
  const [showCountDropdown, setShowCountDropdown] = useState(false)
  const [searching, setSearching]       = useState(false)
  const [error, setError]               = useState(null)
  const [selectedPresets, setSelectedPresets] = useState(new Set())
  const [filters, setFilters] = useState({
    aiScoring: true, excludeExisting: true, emailEnrichment: false, firstConnections: false,
  })

  const toggleYear = (y) => setFoundedYears(p => p.includes(y) ? p.filter(x => x !== y) : [...p, y])
  const toggleFilter = (k) => setFilters(p => ({ ...p, [k]: !p[k] }))

  const togglePreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    const next = new Set(selectedPresets)
    if (next.has(key)) next.delete(key); else next.add(key)
    setSelectedPresets(next)
    const mergedBg = new Set(), mergedSec = new Set()
    next.forEach(k => {
      PRESETS[k].backgrounds.forEach(b => mergedBg.add(b))
      PRESETS[k].sectors.forEach(s => mergedSec.add(s))
    })
    setBackgrounds([...mergedBg])
    setSectors([...mergedSec])
  }

  const handleSearch = async () => {
    setSearching(true); setError(null)
    try {
      const stageVal = stage === 'Pre-seed or Seed' ? 'seed-stage or pre-seed'
        : stage === 'Any stage' ? '' : stage
      const result = await searchFounders({
        query, backgrounds, sectors,
        location: location === 'All India' ? 'India' : location,
        stage: stageVal,
        year: foundedYears.length > 0 ? foundedYears.join(' or ') : '',
        count: exportCount,
        save: false
      })
      if (result.success) onSearchComplete(result.results || [])
      else setError(result.message || 'No founders found.')
    } catch (err) {
      setError(err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <PageShell
      title="Omni Discovery"
      subtitle=""
      rightHeaderSlot={
        <button type="button" onClick={onViewSaved}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-white px-3 py-1.5 text-xs font-medium text-[#5A5650] hover:bg-[#F5F4F0] transition-colors shadow-sm">
          <RefreshCw className="h-3 w-3" /> View saved founders
        </button>
      }
    >
      <div className="flex h-full flex-col gap-6 overflow-y-auto pb-8 pt-2">
        {/* Hero */}
        <div className="text-center shrink-0">
          <h1 className="text-[2.25rem] font-bold leading-tight text-[#1A1815]"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Who should WEH be{' '}
            <span className="italic" style={{ color: '#C85A1A' }}>talking to?</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#5A5650] leading-relaxed">
            Describe who you're looking for — founders, LPs, investors, or anyone else.
            <br />Our agent will search LinkedIn and deliver a scored, enriched list.
          </p>
        </div>

        {/* NLP search box */}
        <div className="mx-auto w-full max-w-4xl shrink-0">
          <div className="rounded-2xl border border-[#E8E5DE] bg-white shadow-sm">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF7102] text-white font-bold text-sm shadow-sm">W</div>
              <input type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Find pre-seed fintech founders from IITs in Bengaluru, founded in 2024 or 2025…"
                className="flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none" />
            </div>
            <div className="flex items-center justify-between border-t border-[#F0EDE6] px-4 py-3">
              <button type="button" className="flex items-center gap-1.5 text-sm text-[#9A958E] hover:text-[#1A1815] transition-colors">
                <span className="text-base">+</span><span>Add filters</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button type="button" onClick={() => setShowCountDropdown(v => !v)}
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
                <button type="button" onClick={handleSearch} disabled={searching}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1815] text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>

        {/* Quick Start */}
        <div className="mx-auto w-full max-w-4xl shrink-0">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8C3BB] font-mono">Quick Start</p>
          <div className="flex items-center gap-1 border-b border-[#E8E5DE]">
            {QUICK_START_TABS.map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-[#FF7102] text-[#FF7102]' : 'border-transparent text-[#5A5650] hover:text-[#1A1815]'}`}>
                <tab.icon className="h-4 w-4" /><span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-b-2xl border border-t-0 border-[#E8E5DE] bg-white p-5 shadow-sm">
            {activeTab === 'role' ? (
              <div>
                <p className="mb-4 text-sm text-[#5A5650] leading-relaxed">
                  Search LinkedIn for people holding specific <strong className="text-[#1A1815]">job titles or roles</strong> — founders, executives, operators, or anyone else.
                </p>

                {/* Presets */}
                <div className="mb-5">
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">⚡ Quick Presets — pick one or many</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <button key={key} type="button" onClick={() => togglePreset(key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedPresets.has(key) ? 'border-[#FFD0AB] bg-[#FFEFE2] text-[#FF7102]' : 'border-[#E8E5DE] bg-white text-[#5A5650] hover:bg-[#F5F4F0]'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Background / Alma Mater</label>
                    <TagInput tags={backgrounds} onTagsChange={setBackgrounds} placeholder="e.g. IIT, Google, McKinsey…" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Location</label>
                    <div className="relative">
                      <select value={location} onChange={e => setLocation(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[#E8E5DE] bg-white px-3 py-2.5 pr-8 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none">
                        {['All India', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune'].map(o => <option key={o}>{o}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A958E]" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Sector / Industry</label>
                    <TagInput tags={sectors} onTagsChange={setSectors} placeholder="Type sector, press Enter…" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Company Stage</label>
                    <div className="relative">
                      <select value={stage} onChange={e => setStage(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[#E8E5DE] bg-white px-3 py-2.5 pr-8 text-sm text-[#1A1815] focus:border-[#FF7102] focus:outline-none">
                        {['Pre-seed or Seed', 'Series A', 'Series B', 'Series C+', 'Any stage'].map(o => <option key={o}>{o}</option>)}
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

                {/* Toggle Filters */}
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

                <div className="my-4 h-px bg-[#F0EDE6]" />

                {/* Footer Row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Export</span>
                    <span className="text-sm font-bold text-[#1A1815]">{exportCount}</span>
                    <span className="text-xs text-[#9A958E]">profiles</span>
                    <input type="range" min={10} max={100} step={5} value={exportCount}
                      onChange={e => setExportCount(Number(e.target.value))}
                      className="w-28 accent-[#FF7102]" />
                  </div>
                  <button type="button" onClick={handleSearch} disabled={searching}
                    className="flex items-center gap-2 rounded-full bg-[#1A1815] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors">
                    {searching ? <><Loader2 className="h-4 w-4 animate-spin" />Searching…</> : <>🔍 Search & Preview</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                {(() => {
                  const Icon = QUICK_START_TABS.find(t => t.id === activeTab)?.icon
                  return Icon ? <div className="mb-3 flex justify-center text-[#FF7102]"><Icon className="h-8 w-8" /></div> : null
                })()}
                <p className="text-sm font-medium text-[#1A1815]">{QUICK_START_TABS.find(t => t.id === activeTab)?.label}</p>
                <p className="mt-1 text-xs text-[#9A958E]">Coming soon — this template is being built.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
