import React, { useState } from 'react'
import SearchForm from './seedFounder/SearchForm.jsx'
import SearchResultsView from './seedFounder/SearchResultsView.jsx'
import SavedFoundersView from './seedFounder/SavedFoundersView.jsx'
import SavedLpsView from './seedFounder/SavedLpsView.jsx'
import RecentSearchesView from './seedFounder/RecentSearchesView.jsx'

function SeedFounderPage() {
  const [view, setView]           = useState('search') // 'search' | 'results' | 'saved' | 'savedLps' | 'recent'
  const [searchResults, setSearchResults] = useState([])

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

  return (
    <SearchForm
      onSearchComplete={(rows) => { setSearchResults(rows); setView('results') }}
      onViewSaved={() => setView('saved')}
      onViewSavedLps={() => setView('savedLps')}
      onViewRecentSearches={() => setView('recent')}
    />
  )
}

export default SeedFounderPage
