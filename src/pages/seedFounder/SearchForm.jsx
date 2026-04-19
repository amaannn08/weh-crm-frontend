import React, { useState } from 'react'
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import { PRESETS, FOUNDED_YEARS } from './constants.js'
import { TagInput } from './shared.jsx'
import { searchFounders } from '../../api/seedFounders'
import PageShell from '../../components/PageShell'

export default function SearchForm({ onSearchComplete, onViewSaved }) {
  const [sectors, setSectors]           = useState(['Fintech'])
  const [backgrounds, setBackgrounds]   = useState([])
  const [location, setLocation]         = useState('All India')
  const [stage, setStage]               = useState('Pre-seed or Seed')
  const [foundedYears, setFoundedYears] = useState(['2024', '2025'])
  const [exportCount, setExportCount]   = useState(25)
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
        backgrounds, sectors,
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
      <div className="flex h-full flex-col gap-5 overflow-y-auto pb-8 pt-2">
        {/* Hero */}
        <div className="text-center shrink-0">
          <h1 className="text-3xl font-bold leading-tight text-[#1A1815]"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Who should WEH be{' '}
            <span className="italic" style={{ color: '#C85A1A' }}>talking to?</span>
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-[13px] text-[#5A5650] leading-relaxed">
            Describe your ICP — our agent searches LinkedIn and delivers a scored, enriched list.
          </p>
        </div>

        {/* Search Panel */}
      <div className="mx-auto w-full max-w-4xl shrink-0">
        <div className="rounded-2xl border border-[#E8E5DE] bg-white p-5 shadow-sm">
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
                  {['All India','Bengaluru','Mumbai','Delhi NCR','Hyderabad','Chennai','Pune'].map(o => <option key={o}>{o}</option>)}
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A958E] font-mono">Results</span>
              <span className="text-sm font-bold text-[#1A1815]">{exportCount}</span>
              <input type="range" min={10} max={100} step={5} value={exportCount}
                onChange={e => setExportCount(Number(e.target.value))}
                className="w-28 accent-[#FF7102]" />
            </div>
            <button type="button" onClick={handleSearch} disabled={searching}
              className="flex items-center gap-2 rounded-full bg-[#1A1815] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#333] disabled:opacity-60 transition-colors">
              {searching ? <><Loader2 className="h-4 w-4 animate-spin" />Searching…</> : <>🔍 Search & Preview</>}
            </button>
          </div>
          {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
    </PageShell>
  )
}
