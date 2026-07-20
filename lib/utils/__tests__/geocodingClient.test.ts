import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import type { Coordinates } from '../../types/geo'
import { DEDUP_WINDOW_MS, CACHE_MAX_ENTRIES } from '../../types/geo'
import {
  sanitizeSearchString,
  fetchRoute,
  drivingMinutes,
  geocodeSearch,
  __clearGeocodingCache,
} from '../geocodingClient'

/**
 * Property-based tests for the sanitizer and shared LRU cache of the
 * Routing_Provider client.
 *
 * Feature: leaflet-maps-integration
 * Property 6 (search-string sanitization), Property 9 (cache reuse / LRU).
 *
 * All outbound calls are mocked — no live Nominatim/OSRM requests are made.
 * The fast-check property runs a minimum of 100 iterations.
 */

const MIN_RUNS = 100

// Canned provider bodies matching the shapes the parsers expect.
const OSRM_BODY = {
  routes: [
    {
      duration: 600, // seconds -> 10 whole minutes
      geometry: { coordinates: [[77.5, 12.9], [77.6, 13.0]] }, // [lng, lat]
    },
  ],
}
const NOMINATIM_BODY = [{ lat: '12.9', lon: '77.5', display_name: 'Test Place' }]

// A URL-aware fetch mock: Nominatim returns the geocode array, OSRM the route
// object. Both respond ok:true so no retry/logging path is exercised.
function makeFetchMock() {
  return vi.fn(async (url: string) => {
    const body = String(url).includes('nominatim') ? NOMINATIM_BODY : OSRM_BODY
    return { ok: true, json: async () => body } as unknown as Response
  })
}

let fetchMock: ReturnType<typeof makeFetchMock>

beforeEach(() => {
  __clearGeocodingCache()
  fetchMock = makeFetchMock()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// Rounds to the module's cache-key precision (5 dp) so generated coordinates
// sit exactly on a bucket, making the "within 5 dp" perturbation deterministic.
const round5 = (v: number): number => Math.round(v * 1e5) / 1e5

// Valid coordinates kept a comfortable margin inside the -90..90 / -180..180
// range so a tiny perturbation can never push them out of bounds.
const safeCoordArb: fc.Arbitrary<Coordinates> = fc.record({
  latitude: fc.double({ min: -89, max: 89, noNaN: true }).map(round5),
  longitude: fc.double({ min: -179, max: 179, noNaN: true }).map(round5),
})

describe('Feature: leaflet-maps-integration, Property 6: Search-string sanitization enforces 256-char cap and encoding', () => {
  // Generators produce well-formed strings (the realistic user-search input
  // space): short/long ASCII plus full-unicode graphemes and long strings that
  // exercise the > 256 rejection branch. Lone UTF-16 surrogates are excluded
  // because they are not valid user text and are not producible by these units.
  const stringArb = fc.oneof(
    fc.string({ maxLength: 512 }),
    fc.string({ minLength: 257, maxLength: 512 }),
    fc.string({ unit: 'grapheme', maxLength: 300 }),
  )

  it('returns null past 256 chars, otherwise a round-trippable URL-encoding (Validates: Requirements 3.3)', () => {
    fc.assert(
      fc.property(stringArb, (q) => {
        const result = sanitizeSearchString(q)
        if (q.length > 256) {
          expect(result).toBeNull()
          return
        }
        // Non-null branch: exactly encodeURIComponent, and a lossless round-trip
        // (no unencoded characters outside the URL-safe set survive).
        expect(result).toBe(encodeURIComponent(q))
        expect(result).not.toBeNull()
        expect(decodeURIComponent(result as string)).toBe(q)
      }),
      { numRuns: MIN_RUNS },
    )
  })
})

describe('Feature: leaflet-maps-integration, Property 9: Cache reuse for near-identical inputs', () => {
  it('reuses the cached route for inputs matching within 5 dp inside the window, issuing no new fetch (Validates: Requirements 12.4)', async () => {
    await fc.assert(
      fc.asyncProperty(safeCoordArb, safeCoordArb, async (a, b) => {
        __clearGeocodingCache()
        fetchMock.mockClear()

        const first = await fetchRoute(a, b)
        // Perturb by 1e-8 — far below the 1e-5 (5 dp) bucket width, so both
        // requests share a cache key.
        const nearA = { latitude: a.latitude + 1e-8, longitude: a.longitude + 1e-8 }
        const nearB = { latitude: b.latitude + 1e-8, longitude: b.longitude + 1e-8 }
        const second = await fetchRoute(nearA, nearB)

        expect(first.ok).toBe(true)
        expect(second.ok).toBe(true)
        expect(fetchMock).toHaveBeenCalledTimes(1)
      }),
      { numRuns: MIN_RUNS },
    )
  })

  it('serves drivingMinutes from a cached route without a new outbound call (Validates: Requirements 12.4, 12.5)', async () => {
    const a: Coordinates = { latitude: 12.97, longitude: 77.59 }
    const b: Coordinates = { latitude: 13.08, longitude: 77.48 }

    const route = await fetchRoute(a, b)
    expect(route.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Same coordinates -> cache hit, reuses the route's duration, no new fetch.
    const mins = await drivingMinutes(a, b)
    expect(mins).toEqual({ ok: true, value: 10 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('geocode results are cached and reused for the identical query (Validates: Requirements 12.4)', async () => {
    const first = await geocodeSearch('lethafi')
    const second = await geocodeSearch('lethafi')

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('caps the cache at 50 entries and evicts the least-recently-used (Validates: Requirements 12.6)', async () => {
    const dest: Coordinates = { latitude: 13.0, longitude: 77.0 }
    // Distinct origins at 5 dp (0.01 step >> 1e-5 bucket width).
    const origin = (i: number): Coordinates => ({ latitude: 12.0, longitude: 70.0 + i * 0.01 })

    // Fill the cache to exactly CACHE_MAX_ENTRIES distinct entries.
    for (let i = 0; i < CACHE_MAX_ENTRIES; i++) {
      await fetchRoute(origin(i), dest)
    }
    expect(fetchMock).toHaveBeenCalledTimes(CACHE_MAX_ENTRIES)

    // One more distinct entry overflows the cap and evicts the oldest (entry 0).
    await fetchRoute(origin(CACHE_MAX_ENTRIES), dest)
    expect(fetchMock).toHaveBeenCalledTimes(CACHE_MAX_ENTRIES + 1)

    // Entry 0 was evicted -> its lookup misses and triggers a new fetch.
    await fetchRoute(origin(0), dest)
    expect(fetchMock).toHaveBeenCalledTimes(CACHE_MAX_ENTRIES + 2)

    // The most-recently-added entry is still cached -> no new fetch.
    await fetchRoute(origin(CACHE_MAX_ENTRIES), dest)
    expect(fetchMock).toHaveBeenCalledTimes(CACHE_MAX_ENTRIES + 2)
  })

  it('re-fetches once the 60s dedup window has elapsed (Validates: Requirements 12.4)', async () => {
    vi.useFakeTimers()
    const a: Coordinates = { latitude: 12.97, longitude: 77.59 }
    const b: Coordinates = { latitude: 13.08, longitude: 77.48 }

    await fetchRoute(a, b)
    await fetchRoute(a, b) // within window -> cache hit
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(DEDUP_WINDOW_MS + 1) // expire the entry
    await fetchRoute(a, b) // stale -> new outbound call
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
