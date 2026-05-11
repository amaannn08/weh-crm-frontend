import React, { useState, useCallback } from 'react'
import SearchForm from './seedFounder/SearchForm.jsx'
import SeededContentView from './seedFounder/SeededContentView.jsx'
import StreamingResultsView from './seedFounder/StreamingResultsView.jsx'
import SavedFoundersView from './seedFounder/SavedFoundersView.jsx'
import SavedLpsView from './seedFounder/SavedLpsView.jsx'
import RecentSearchesView from './seedFounder/RecentSearchesView.jsx'
import SavedSearchesView from './seedFounder/SavedSearchesView.jsx'

function SeedFounderPage() {
  const [view, setView]               = useState('search')
  const [activeSession, setActiveSession] = useState(null)

  const handleSearchComplete = useCallback((sessionId, sessionName) => {
    console.log('[SeedFounder] Search started, showing streaming view:', { sessionId, sessionName })
    setActiveSession({ sessionId, sessionName })
    setView('streaming')
  }, [])

  const handleStreamDone = useCallback(() => {
    console.log('[SeedFounder] Stream done - switching to final results')
    setView('results')
  }, [])

  // Called from RecentSearchesView when a row is clicked
  const handleViewSession = useCallback((sessionId, sessionName) => {
    setActiveSession({ sessionId, sessionName })
    setView('results')
  }, [])

  // Streaming view - shows live results as they come in
  if (view === 'streaming' && activeSession) {
    return (
      <StreamingResultsView
        sessionId={activeSession.sessionId}
        sessionName={activeSession.sessionName}
      />
    )
  }

  // Final results view - shows deduplicated results after stream completes,
  // or historical session results opened from Recent Searches.
  if (view === 'results' && activeSession) {
    return (
      <SeededContentView
        sessionId={activeSession.sessionId}
        sessionName={activeSession.sessionName}
        onNewSearch={() => {
          setActiveSession(null)
          setView('search')
        }}
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
    return (
      <RecentSearchesView
        onNewSearch={() => setView('search')}
        onViewSession={handleViewSession}
      />
    )
  }

  if (view === 'savedSearches') {
    return <SavedSearchesView onNewSearch={() => setView('search')} onSearchComplete={handleSearchComplete} onStreamDone={handleStreamDone} />
  }

  return (
    <SearchForm
      onSearchComplete={handleSearchComplete}
      onStreamDone={handleStreamDone}
      onViewSaved={() => setView('saved')}
      onViewSavedLps={() => setView('savedLps')}
      onViewRecentSearches={() => setView('recent')}
      onViewSavedSearches={() => setView('savedSearches')}
    />
  )
}

export default SeedFounderPage
