import React, { useState, useRef, useCallback } from 'react'
import SearchForm from './seedFounder/SearchForm.jsx'
import SeededContentView from './seedFounder/SeededContentView.jsx'
import SavedFoundersView from './seedFounder/SavedFoundersView.jsx'
import SavedLpsView from './seedFounder/SavedLpsView.jsx'
import RecentSearchesView from './seedFounder/RecentSearchesView.jsx'
import SavedSearchesView from './seedFounder/SavedSearchesView.jsx'

function SeedFounderPage() {
  const [view, setView]               = useState('search')
  const [activeSession, setActiveSession] = useState(null)

  const handleSearchComplete = useCallback((sessionId, sessionName) => {
    console.log('[SeedFounder] Search complete, navigating to results:', { sessionId, sessionName })
    setActiveSession({ sessionId, sessionName })
    setView('results')
  }, [])

  const handleStreamDone = useCallback(() => {
    console.log('[SeedFounder] Stream done callback (no-op for saved searches)')
  }, [])

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
    return <RecentSearchesView onNewSearch={() => setView('search')} />
  }

  if (view === 'savedSearches') {
    return <SavedSearchesView onNewSearch={() => setView('search')} onSearchComplete={handleSearchComplete} onStreamDone={handleStreamDone} />
  }

  return (
    <SearchForm
      onSearchComplete={handleSearchComplete}
      onViewSaved={() => setView('saved')}
      onViewSavedLps={() => setView('savedLps')}
      onViewRecentSearches={() => setView('recent')}
      onViewSavedSearches={() => setView('savedSearches')}
    />
  )
}

export default SeedFounderPage
