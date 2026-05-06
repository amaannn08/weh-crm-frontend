import React, { useState, useRef, useCallback } from 'react'
import SearchForm from './seedFounder/SearchForm.jsx'
import SearchResultsView from './seedFounder/SearchResultsView.jsx'
import SavedFoundersView from './seedFounder/SavedFoundersView.jsx'
import SavedLpsView from './seedFounder/SavedLpsView.jsx'
import RecentSearchesView from './seedFounder/RecentSearchesView.jsx'
import SavedSearchesView from './seedFounder/SavedSearchesView.jsx'
import { saveSearchRun } from '../api/seedFounders'

function SeedFounderPage() {
  const [view, setView]           = useState('search')
  const [searchResults, setSearchResults] = useState([])
  const pendingSavedSearchIdRef   = useRef(null)
  const activeRunIdRef            = useRef(null)
  const flushTimerRef             = useRef(null)
  const pendingRowsRef            = useRef([])
  const flushInFlightRef          = useRef(false)

  // Called on every item_batch — debounced, always uses latest rows
  const handleBatch = useCallback((rows) => {
    if (!pendingSavedSearchIdRef.current) return
    pendingRowsRef.current = rows // always keep latest
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
    flushTimerRef.current = setTimeout(async () => {
      flushTimerRef.current = null
      if (flushInFlightRef.current) return // skip if a flush is already running
      const id = pendingSavedSearchIdRef.current
      if (!id) return
      flushInFlightRef.current = true
      try {
        const result = await saveSearchRun(id, pendingRowsRef.current, activeRunIdRef.current)
        if (result?.id) activeRunIdRef.current = result.id
      } catch (e) {
        console.warn('[savedSearch] batch flush failed:', e.message)
      } finally {
        flushInFlightRef.current = false
      }
    }, 2000)
  }, [])

  const handleSearchComplete = useCallback(async (rows) => {
    setSearchResults(rows)
    setView('results')
    // Final flush — cancel any pending debounce and write complete results
    if (pendingSavedSearchIdRef.current && rows.length > 0) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
      const id = pendingSavedSearchIdRef.current
      const runId = activeRunIdRef.current
      pendingSavedSearchIdRef.current = null
      activeRunIdRef.current = null
      pendingRowsRef.current = []
      flushInFlightRef.current = false
      saveSearchRun(id, rows, runId).catch(() => {})
    }
  }, [])

  if (view === 'results') {
    return (
      <SearchResultsView
        rows={searchResults}
        onNewSearch={() => setView('search')}
        onSaved={() => setView('saved')}
        onSavedLps={() => setView('savedLps')}
        onRecentSearches={() => setView('recent')}
      />
    )
  }

  if (view === 'saved') {
    return <SavedFoundersView onNewSearch={() => setView('search')} />
  }

  if (view === 'savedLps') {
    return <SavedLpsView onNewSearch={() => setView('search')} />
  }

  if (view === 'recent') {
    return <RecentSearchesView onNewSearch={() => setView('search')} />
  }

  if (view === 'savedSearches') {
    return <SavedSearchesView onNewSearch={() => setView('search')} />
  }

  return (
    <SearchForm
      onSearchComplete={handleSearchComplete}
      onBatch={handleBatch}
      onSavedSearchCreated={(id, currentResults = []) => {
        // Set the saved search ID so batches start updating it
        pendingSavedSearchIdRef.current = id
        activeRunIdRef.current = null
        pendingRowsRef.current = []
        
        // If there are already results (search running or completed), save them immediately
        if (currentResults.length > 0) {
          saveSearchRun(id, currentResults, null).then((result) => {
            if (result?.id) activeRunIdRef.current = result.id
          }).catch((e) => {
            console.warn('[savedSearch] immediate save failed:', e.message)
          })
        }
      }}
      onViewSaved={() => setView('saved')}
      onViewSavedLps={() => setView('savedLps')}
      onViewRecentSearches={() => setView('recent')}
      onViewSavedSearches={() => setView('savedSearches')}
    />
  )
}

export default SeedFounderPage
