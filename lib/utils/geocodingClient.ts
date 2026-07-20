/**
 * Routing_Provider client for the Leaflet Maps Integration feature — the only
 * module in the feature that issues outbound network requests. It enforces
 * every trust-boundary rule in Requirement 3 and the resource limits in
 * Requirement 12:
 *
 * - Host allow-list checked before every request; a non-listed host returns an
 *   immediate error `Result` and issues no request (Req 3.3).
 * - User search strings capped at 256 characters and URL-encoded (Req 3.3).
 * - Per-request timeout via `AbortController`: 10s for geocoding (Req 3.5),
 *   5s for driving-time / route (Req 8.4).
 * - At most 2 retries after the first failure, then a generic error `Result`
 *   (Req 3.7, 3.5).
 * - Bounded LRU cache (max 50 entries) with a 60s dedup window keyed at
 *   5-decimal coordinate precision; within the window the cached result is
 *   reused and no new outbound call is made (Req 12.4, 12.6).
 * - Detail is logged server-side only (rule R11 / Req 3.5); the client only
 *   ever sees a generic error message with no PII or raw error, and there are
 *   no `console.log` statements in this module (Req 13.4).
 * - Every exported function returns a `Result<T>` so callers never face an
 *   unhandled rejection or uncaught throw (Req 13.6).
 */

import type { Coordinates, GeocodeHit, RoutePath, Result } from '../types/geo'
import {
  GEO_TIMEOUT_MS,
  ROUTING_TIMEOUT_MS,
  CACHE_MAX_ENTRIES,
  DEDUP_WINDOW_MS,
  COORD_PRECISION_DP,
} from '../types/geo'
import { validateCoordinates } from './geoValidation'

/**
 * Fixed, allow-listed provider hosts. No request is issued to any host outside
 * this list (Req 3.3). OpenStreetMap Nominatim serves geocoding; OSRM serves
 * driving time and route geometry.
 */
export const ALLOWED_HOSTS = ['nominatim.openstreetmap.org', 'router.project-osrm.org'] as const

/** Maximum length of a user-supplied search string before rejection (Req 3.3). */
const MAX_SEARCH_LENGTH = 256

/** Total attempts per request: the first try plus at most 2 retries (Req 3.7). */
const MAX_ATTEMPTS = 3

/** Generic, PII-free message surfaced to the client on any failure (Req 3.5). */
const GENERIC_ERROR = 'Location service temporarily unavailable'

/**
 * Logs failure detail server-side only, preserving rule R11 (Req 3.5). On the
 * client this is a no-op so no raw error or PII ever reaches the browser. Uses
 * `console.error` rather than `console.log` to satisfy Req 13.4.
 * @param context short label for the failing operation
 * @param detail the underlying error or diagnostic value
 */
function logServerDetail(context: string, detail: unknown): void {
  if (typeof window === 'undefined') {
    // Server-side only (Req 3.5 / R11).
    console.error(`[geocodingClient] ${context}:`, detail)
  }
}

/**
 * Returns true when `url`'s host is on the allow-list (Req 3.3).
 * @param url a fully-qualified request URL
 * @returns whether the request may be issued
 */
function isAllowedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (ALLOWED_HOSTS as readonly string[]).includes(host)
  } catch {
    return false
  }
}

/** Rounds a coordinate to COORD_PRECISION_DP for stable, deduped cache keys. */
function roundCoord(value: number): number {
  const factor = 10 ** COORD_PRECISION_DP
  return Math.round(value * factor) / factor
}

/** One LRU cache entry: the successful value and the epoch ms it was stored. */
interface CacheEntry<T> {
  value: T
  storedAt: number
}

/**
 * Shared bounded LRU cache across geocoding and routing results (Req 12.6).
 * A Map preserves insertion order: reads re-insert to mark most-recently-used,
 * and overflow evicts the oldest (first) key. Values are stored as `unknown`
 * and read back through the typed generic helper below.
 */
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Reads a still-fresh cached value for `key`, or `undefined` on miss/expiry.
 * A hit within DEDUP_WINDOW_MS is reused without an outbound call (Req 12.4);
 * an expired entry is deleted. Hits are marked most-recently-used (Req 12.6).
 */
function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (entry === undefined) return undefined
  if (Date.now() - entry.storedAt > DEDUP_WINDOW_MS) {
    cache.delete(key)
    return undefined
  }
  // Mark most-recently-used by reinserting at the tail.
  cache.delete(key)
  cache.set(key, entry)
  return entry.value as T
}

/**
 * Stores a successful `value` under `key`, evicting the least-recently-used
 * entry when the cache exceeds CACHE_MAX_ENTRIES (Req 12.6).
 */
function cacheSet<T>(key: string, value: T): void {
  cache.set(key, { value, storedAt: Date.now() })
  if (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) {
      cache.delete(oldest)
    }
  }
}

/**
 * Clears the shared cache. Exposed for tests; not used in production paths.
 */
export function __clearGeocodingCache(): void {
  cache.clear()
}

/**
 * Validates the host, then fetches `url` with an `AbortController` timeout and
 * up to MAX_ATTEMPTS total attempts, parsing the JSON body with `parse`. All
 * failures collapse to a single generic error `Result` after detail is logged
 * server-side (Req 3.3, 3.5, 3.7, 13.6).
 * @param url fully-qualified request URL (host must be allow-listed)
 * @param timeoutMs per-attempt abort timeout in milliseconds
 * @param parse maps the decoded JSON body to a `Result<T>`
 * @param context short label used for server-side logging
 * @returns a `Result<T>` — never throws
 */
async function requestJson<T>(
  url: string,
  timeoutMs: number,
  parse: (body: unknown) => Result<T>,
  context: string
): Promise<Result<T>> {
  if (!isAllowedHost(url)) {
    // Non-listed host: immediate error, no request issued (Req 3.3).
    logServerDetail(context, `blocked non-allow-listed host for url`)
    return { ok: false, error: GENERIC_ERROR }
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      })
      if (!res.ok) {
        throw new Error(`non-success status ${res.status}`)
      }
      const body: unknown = await res.json()
      return parse(body)
    } catch (err) {
      logServerDetail(context, { attempt, err })
      // Retry after the first failure, at most 2 more times (Req 3.7).
    } finally {
      clearTimeout(timer)
    }
  }
  return { ok: false, error: GENERIC_ERROR }
}

/**
 * Rejects search strings longer than 256 characters and URL-encodes the rest
 * so they are safe to place in a query string (Req 3.3).
 * @param q the raw user-supplied search string
 * @returns the URL-encoded string, or `null` when it exceeds 256 characters
 */
export function sanitizeSearchString(q: string): string | null {
  if (q.length > MAX_SEARCH_LENGTH) {
    return null
  }
  return encodeURIComponent(q)
}

/**
 * Geocodes a free-text search string via OpenStreetMap Nominatim, returning
 * validated coordinate hits (Req 3.3, 3.5, 12.4). Rejects over-long strings,
 * URL-encodes the query, sends it only to the allow-listed Nominatim host, and
 * uses a 10s timeout with up to 2 retries. Results are cached for 60s.
 * @param q the raw user-supplied search string
 * @returns `Result<GeocodeHit[]>` — a generic error on any failure
 */
export async function geocodeSearch(q: string): Promise<Result<GeocodeHit[]>> {
  const encoded = sanitizeSearchString(q)
  if (encoded === null) {
    return { ok: false, error: GENERIC_ERROR }
  }

  const key = `geo:${encoded}`
  const cached = cacheGet<GeocodeHit[]>(key)
  if (cached !== undefined) {
    return { ok: true, value: cached }
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1`
  const result = await requestJson<GeocodeHit[]>(
    url,
    GEO_TIMEOUT_MS,
    (body) => {
      if (!Array.isArray(body)) {
        return { ok: false, error: GENERIC_ERROR }
      }
      const hits: GeocodeHit[] = []
      for (const raw of body) {
        if (typeof raw !== 'object' || raw === null) continue
        const row = raw as Record<string, unknown>
        const lat = Number(row.lat)
        const lon = Number(row.lon)
        const coords = validateCoordinates(lat, lon)
        if (!coords.ok) continue
        const displayName = typeof row.display_name === 'string' ? row.display_name : ''
        hits.push({ latitude: coords.value.latitude, longitude: coords.value.longitude, displayName })
      }
      return { ok: true, value: hits }
    },
    'geocodeSearch'
  )

  if (result.ok) {
    cacheSet(key, result.value)
  }
  return result
}

/**
 * Builds a stable, deduped cache key for a coordinate pair at 5-decimal
 * precision (Req 12.4), prefixed by `kind` to separate route/driving lookups.
 */
function coordPairKey(kind: string, a: Coordinates, b: Coordinates): string {
  return [
    kind,
    roundCoord(a.latitude),
    roundCoord(a.longitude),
    roundCoord(b.latitude),
    roundCoord(b.longitude),
  ].join(':')
}

/**
 * Fetches a driving route between two coordinates via OSRM, returning the path
 * geometry and estimated driving time (Req 10.7). Validates both coordinates,
 * sends only to the allow-listed OSRM host, uses a 5s timeout with up to 2
 * retries, and caches the result for 60s (Req 8.4, 12.4).
 * @param a origin coordinate (e.g. the user's location)
 * @param b destination coordinate (e.g. the restaurant)
 * @returns `Result<RoutePath>` — a generic error on any failure
 */
export async function fetchRoute(a: Coordinates, b: Coordinates): Promise<Result<RoutePath>> {
  const av = validateCoordinates(a.latitude, a.longitude)
  const bv = validateCoordinates(b.latitude, b.longitude)
  if (!av.ok || !bv.ok) {
    return { ok: false, error: GENERIC_ERROR }
  }

  const key = coordPairKey('route', a, b)
  const cached = cacheGet<RoutePath>(key)
  if (cached !== undefined) {
    return { ok: true, value: cached }
  }

  // OSRM expects `lng,lat` order.
  const coordsPath = `${a.longitude},${a.latitude};${b.longitude},${b.latitude}`
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsPath}?overview=full&geometries=geojson`
  const result = await requestJson<RoutePath>(
    url,
    ROUTING_TIMEOUT_MS,
    (body) => {
      if (typeof body !== 'object' || body === null) {
        return { ok: false, error: GENERIC_ERROR }
      }
      const routes = (body as Record<string, unknown>).routes
      if (!Array.isArray(routes) || routes.length === 0) {
        return { ok: false, error: GENERIC_ERROR }
      }
      const route = routes[0] as Record<string, unknown>
      const geometry = route.geometry as Record<string, unknown> | undefined
      const rawCoords = geometry?.coordinates
      const points: Array<[number, number]> = []
      if (Array.isArray(rawCoords)) {
        for (const pair of rawCoords) {
          if (!Array.isArray(pair) || pair.length < 2) continue
          const lon = Number(pair[0])
          const lat = Number(pair[1])
          const coords = validateCoordinates(lat, lon)
          if (!coords.ok) continue
          // Route geometry is stored as [latitude, longitude] (Req 10.7).
          points.push([coords.value.latitude, coords.value.longitude])
        }
      }
      const durationSeconds = Number(route.duration)
      const path: RoutePath = { points }
      if (Number.isFinite(durationSeconds) && durationSeconds >= 0) {
        path.durationMinutes = Math.round(durationSeconds / 60)
      }
      return { ok: true, value: path }
    },
    'fetchRoute'
  )

  if (result.ok) {
    cacheSet(key, result.value)
  }
  return result
}

/**
 * Estimates driving time in whole minutes between two coordinates via the
 * Routing_Provider (Req 8.4, 8.5). Reuses {@link fetchRoute} so a cached route
 * within the dedup window serves this call with no new outbound request
 * (Req 12.4). Returns a generic error when routing fails or omits a duration.
 * @param a origin coordinate (e.g. the user's location)
 * @param b destination coordinate (e.g. the restaurant)
 * @returns `Result<number>` — driving minutes, or a generic error
 */
export async function drivingMinutes(a: Coordinates, b: Coordinates): Promise<Result<number>> {
  const route = await fetchRoute(a, b)
  if (!route.ok) {
    return route
  }
  if (route.value.durationMinutes === undefined) {
    return { ok: false, error: GENERIC_ERROR }
  }
  return { ok: true, value: route.value.durationMinutes }
}
