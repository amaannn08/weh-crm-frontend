/**
 * Lightweight in-memory cache for frontend API responses.
 * TTL defaults to 5 minutes. Keys are arbitrary strings.
 * 
 * Usage:
 *   import { cache } from './cache'
 *   const data = await cache.get('deals', () => fetchDeals(), 5 * 60 * 1000)
 */

const store = new Map() // key → { data, expiresAt }

export const cache = {
    /**
     * Retrieve from cache or fetch fresh data.
     * @param {string} key - Cache key
     * @param {() => Promise<any>} fetcher - Async function to fetch fresh data
     * @param {number} ttl - TTL in ms (default: 5 min)
     */
    async get(key, fetcher, ttl = 5 * 60 * 1000) {
        const entry = store.get(key)
        if (entry && Date.now() < entry.expiresAt) {
            return entry.data
        }
        const data = await fetcher()
        store.set(key, { data, expiresAt: Date.now() + ttl })
        return data
    },

    /** Manually invalidate a cache key (or all keys matching a prefix). */
    invalidate(keyOrPrefix) {
        for (const k of store.keys()) {
            if (k === keyOrPrefix || k.startsWith(keyOrPrefix + ':')) {
                store.delete(k)
            }
        }
    },

    /** Overwrite a cached entry with new data (keeps same TTL). */
    set(key, data, ttl = 5 * 60 * 1000) {
        store.set(key, { data, expiresAt: Date.now() + ttl })
    },

    /** Check if a valid non-expired entry exists. */
    has(key) {
        const entry = store.get(key)
        return !!entry && Date.now() < entry.expiresAt
    },

    /** Clear all cached entries. */
    clear() {
        store.clear()
    }
}
