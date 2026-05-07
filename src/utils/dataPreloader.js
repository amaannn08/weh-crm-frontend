/**
 * Data Preloader - Loads all seed founder data on app startup
 * Stores in localStorage for instant page loads
 */

import { listFounders, listLps, listSavedSearches } from '../api/seedFounders'

const PRELOAD_KEYS = {
  FOUNDERS: 'seedFounders:preload:founders',
  LPS: 'seedFounders:preload:lps',
  SAVED_SEARCHES: 'seedFounders:preload:savedSearches',
  LAST_PRELOAD: 'seedFounders:preload:timestamp'
}

const PRELOAD_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Save data to localStorage with timestamp
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e)
  }
}

/**
 * Load data from localStorage
 */
function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.data
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e)
    return null
  }
}

/**
 * Check if preload is needed (no data or data is stale)
 */
function shouldPreload() {
  const lastPreload = localStorage.getItem(PRELOAD_KEYS.LAST_PRELOAD)
  if (!lastPreload) return true
  
  const elapsed = Date.now() - parseInt(lastPreload, 10)
  return elapsed > PRELOAD_INTERVAL
}

/**
 * Preload all seed founder data
 */
export async function preloadSeedFounderData() {
  if (!shouldPreload()) {
    console.log('[Preloader] Data is fresh, skipping preload')
    return
  }

  console.log('[Preloader] Starting data preload...')
  
  try {
    // Load all data in parallel
    const [founders, lps, savedSearches] = await Promise.allSettled([
      listFounders({ limit: 500 }),
      listLps({ limit: 500 }),
      listSavedSearches()
    ])

    // Save founders
    if (founders.status === 'fulfilled') {
      saveToStorage(PRELOAD_KEYS.FOUNDERS, founders.value)
      console.log('[Preloader] Saved founders:', founders.value?.founders?.length || 0)
    }

    // Save LPs
    if (lps.status === 'fulfilled') {
      saveToStorage(PRELOAD_KEYS.LPS, lps.value)
      console.log('[Preloader] Saved LPs:', lps.value?.lps?.length || 0)
    }

    // Save saved searches
    if (savedSearches.status === 'fulfilled') {
      saveToStorage(PRELOAD_KEYS.SAVED_SEARCHES, savedSearches.value)
      console.log('[Preloader] Saved searches:', savedSearches.value?.savedSearches?.length || 0)
    }

    // Update last preload timestamp
    localStorage.setItem(PRELOAD_KEYS.LAST_PRELOAD, Date.now().toString())
    console.log('[Preloader] Preload complete!')
  } catch (e) {
    console.error('[Preloader] Preload failed:', e)
  }
}

/**
 * Get preloaded founders (instant, no API call)
 */
export function getPreloadedFounders() {
  return loadFromStorage(PRELOAD_KEYS.FOUNDERS)
}

/**
 * Get preloaded LPs (instant, no API call)
 */
export function getPreloadedLps() {
  return loadFromStorage(PRELOAD_KEYS.LPS)
}

/**
 * Get preloaded saved searches (instant, no API call)
 */
export function getPreloadedSavedSearches() {
  return loadFromStorage(PRELOAD_KEYS.SAVED_SEARCHES)
}

/**
 * Invalidate preloaded data (force refresh on next load)
 */
export function invalidatePreloadedData() {
  localStorage.removeItem(PRELOAD_KEYS.LAST_PRELOAD)
  console.log('[Preloader] Data invalidated, will refresh on next preload')
}

/**
 * Clear all preloaded data
 */
export function clearPreloadedData() {
  Object.values(PRELOAD_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('[Preloader] All preloaded data cleared')
}
