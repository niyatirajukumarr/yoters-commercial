/**
 * Distance_Service for the Leaflet Maps Integration feature (Req 8).
 *
 * Pure, framework-free geodesic distance and walking-time estimates between
 * two coordinates. `computeDistance` is memoized with a bounded LRU cache
 * keyed on inputs rounded to COORD_PRECISION_DP, so unchanged inputs reuse a
 * prior result without recomputation (Req 12.5). Driving time is intentionally
 * NOT computed here — it requires an async Routing_Provider call and would
 * break the purity of this module (Req 8.4-8.6 live in the geocoding client).
 */

import type { Coordinates, DistanceResult } from '../types/geo'
import { WALKING_SPEED_KMH, CACHE_MAX_ENTRIES, COORD_PRECISION_DP } from '../types/geo'

/** Mean Earth radius in kilometers used for the Haversine formula. */
const EARTH_RADIUS_KM = 6371

/** Converts decimal degrees to radians. */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Great-circle distance between two coordinates in kilometers (Req 8.1).
 *
 * Pure and symmetric: `haversineKm(a, b) === haversineKm(b, a)` for all
 * inputs, since the formula depends only on the latitude delta, longitude
 * delta, and the product of the two cosines — all symmetric in `a` and `b`.
 *
 * @param a first coordinate
 * @param b second coordinate
 * @returns geodesic distance in kilometers
 */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return EARTH_RADIUS_KM * c
}

/**
 * Estimated walking time in whole minutes at the fixed WALKING_SPEED_KMH,
 * rounded to the nearest minute for display (Req 8.3).
 *
 * The underlying formula is `distanceKm / WALKING_SPEED_KMH * 60`; the return
 * value is that quantity rounded to the nearest whole minute. The function is
 * monotonic non-decreasing in `distanceKm` because rounding preserves order.
 *
 * @param distanceKm geodesic distance in kilometers (finite, >= 0)
 * @returns walking time in whole minutes
 */
export function walkingMinutes(distanceKm: number): number {
  return Math.round((distanceKm / WALKING_SPEED_KMH) * 60)
}

/**
 * Bounded LRU cache for computeDistance results, keyed on the rounded
 * coordinate pair. A Map preserves insertion order; on a hit we delete and
 * re-insert the key to mark it most-recently-used, and on overflow we evict
 * the oldest (first) entry (Req 12.6).
 */
const distanceCache = new Map<string, DistanceResult>()

/** Rounds a coordinate value to COORD_PRECISION_DP for stable cache keys. */
function roundCoord(value: number): number {
  const factor = 10 ** COORD_PRECISION_DP
  return Math.round(value * factor) / factor
}

/** Builds a stable cache key from a coordinate pair at COORD_PRECISION_DP. */
function cacheKey(a: Coordinates, b: Coordinates): string {
  return [
    roundCoord(a.latitude),
    roundCoord(a.longitude),
    roundCoord(b.latitude),
    roundCoord(b.longitude),
  ].join(',')
}

/**
 * Computes the geodesic distance and walking time between two coordinates,
 * memoized on the rounded inputs (Req 8.1, 8.3, 12.5).
 *
 * Repeated calls with coordinates that round to the same COORD_PRECISION_DP
 * key reuse the cached result. Driving time is not included here (Req 8.4-8.6
 * are handled by the async geocoding client).
 *
 * @param a first coordinate (e.g. the user's location)
 * @param b second coordinate (e.g. the restaurant)
 * @returns a {@link DistanceResult} with `distanceKm` and `walkingMinutes`
 */
export function computeDistance(a: Coordinates, b: Coordinates): DistanceResult {
  const key = cacheKey(a, b)
  const cached = distanceCache.get(key)
  if (cached !== undefined) {
    // Mark as most-recently-used by reinserting at the tail.
    distanceCache.delete(key)
    distanceCache.set(key, cached)
    return cached
  }

  const distanceKm = haversineKm(a, b)
  const result: DistanceResult = { distanceKm, walkingMinutes: walkingMinutes(distanceKm) }

  distanceCache.set(key, result)
  if (distanceCache.size > CACHE_MAX_ENTRIES) {
    const oldest = distanceCache.keys().next().value
    if (oldest !== undefined) {
      distanceCache.delete(oldest)
    }
  }
  return result
}
