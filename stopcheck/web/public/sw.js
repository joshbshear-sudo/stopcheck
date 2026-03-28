/**
 * StopCheck Service Worker — offline caching for podium compliance check.
 *
 * Caches:
 * 1. App shell (HTML, JS, CSS) — cache-first for offline access
 * 2. Rider data + results — stored via Cache API from the app
 * 3. API responses — network-first with cache fallback
 */

const CACHE_NAME = 'stopcheck-v1'
const RIDER_CACHE = 'stopcheck-rider-data'

const SHELL_FILES = [
  '/',
  '/manifest.json',
]

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RIDER_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API requests: network-first, cache fallback for rider data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful rider data responses
          if (response.ok && url.pathname.includes('/rider/by-token/')) {
            const clone = response.clone()
            caches.open(RIDER_CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
