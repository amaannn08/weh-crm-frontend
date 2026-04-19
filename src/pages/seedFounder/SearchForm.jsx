import React, { useState } from 'react'
import { ChevronDown, Loader2, RefreshCw, ArrowUp } from 'lucide-react'
import { PRESETS, FOUNDED_YEARS } from './constants.js'
import { TagInput } from './shared.jsx'
import { searchFounders } from '../../api/seedFounders'
import PageShell from '../../components/PageShell'

const RESULT_COUNTS = [10, 25, 50, 100]

export default function SearchForm({ onSearchComplete, onViewSaved }) {
  const [query, setQuery]               = useState('')
  const [sectors, setSectors]           = useState([])
  const [backgrounds, setBackgrounds]   = useState([])
  const [location, setLocation]         = useState('All India')
  const [stage, setStage]               = useState('Any stage')
  const [foundedYears, setFoundedYears] = useState([])
  const [exportCount, setExportCount]   = useState(25)
  const [resultCount, setResultCount]   = useState(25)
  const [showCountDropdown, setShowCountDropdown] = useState(false)
  const [showFilters, setShowFilters]   = useState(true)
  const [searching, setSearching]       = useState(false)
  const [error, setError]               = useState(null)
  const [selectedPresets, setSelectedPresets] = useState(new Set())
  const [filters, setFilters] = useState({
    aiScoring: false, excludeExisting: false, emailEnrichment: false, firstConnections: false,
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

        {/* NLP search box with Filters inside */}
        <div className="mx-auto w-full max-w-4xl shrink-0">
          <div className="rounded-2xl border border-[#E8E5DE] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF7102] text-white font-bold text-sm shadow-sm">W</div>
              <input type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Find pre-seed fintech founders from IITs in Bengaluru, founded in 2024 or 2025…"
                className="flex-1 bg-transparent text-sm text-[#1A1815] placeholder:text-[#C8C3BB] focus:outline-none" />
            </div>
            <div className={`flex items-center justify-between border-t border-[#F0EDE6] px-4 py-3 ${showFilters ? 'border-b' : ''}`}>
              <button type="button" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 text-sm text-[#9A958E] hover:text-[#1A1815] transition-colors">
                <span className="text-base">{showFilters ? '-' : '+'}</span><span>{showFilters ? 'Hide filters' : 'Add filters'}</span>
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

            {/* Expandable Filters Section */}
            {showFilters && (
              <div className="bg-[#FAFAF8] p-5">
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
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </PageShell>
  )
}

