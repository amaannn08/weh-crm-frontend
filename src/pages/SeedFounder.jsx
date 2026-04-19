import React, { useState } from 'react'
import SearchForm from './seedFounder/SearchForm.jsx'
import SearchResultsView from './seedFounder/SearchResultsView.jsx'
import SavedFoundersView from './seedFounder/SavedFoundersView.jsx'

function SeedFounderPage() {
  const [view, setView]           = useState('search') // 'search' | 'results' | 'saved'
  const [searchResults, setSearchResults] = useState([])

  if (view === 'results') {
    return (
      <SearchResultsView
        rows={searchResults}
        onNewSearch={() => setView('search')}
        onSaved={() => setView('saved')}
      />
    )
  }

  if (view === 'saved') {
    return <SavedFoundersView onNewSearch={() => setView('search')} />
  }

  return (
    <SearchForm
      onSearchComplete={(rows) => { setSearchResults(rows); setView('results') }}
      onViewSaved={() => setView('saved')}
    />
  )
}

export default SeedFounderPage
