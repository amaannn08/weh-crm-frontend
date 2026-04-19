import React, { useState } from 'react'
import SearchForm from './seedFounder/SearchForm.jsx'
import SearchResultsView from './seedFounder/SearchResultsView.jsx'
import SavedFoundersView from './seedFounder/SavedFoundersView.jsx'
import SavedLpsView from './seedFounder/SavedLpsView.jsx'

function SeedFounderPage() {
  const [view, setView]           = useState('search') // 'search' | 'results' | 'saved' | 'savedLps'
  const [searchResults, setSearchResults] = useState([])

  if (view === 'results') {
    return (
      <SearchResultsView
        rows={searchResults}
        onNewSearch={() => setView('search')}
        onSaved={() => setView('saved')}
        onSavedLps={() => setView('savedLps')}
      />
    )
  }

  if (view === 'saved') {
    return <SavedFoundersView onNewSearch={() => setView('search')} />
  }

  if (view === 'savedLps') {
    return <SavedLpsView onNewSearch={() => setView('search')} />
  }

  return (
    <SearchForm
      onSearchComplete={(rows) => { setSearchResults(rows); setView('results') }}
      onViewSaved={() => setView('saved')}
      onViewSavedLps={() => setView('savedLps')}
    />
  )
}

export default SeedFounderPage
