/**
 * Property tests for the Distance_Service (`lib/utils/distanceService.ts`).
 *
 * Covers Req 8 acceptance criteria for the pure geodesic/travel-time layer:
 *  - Property 2 (Req 8.9): computeDistance is deterministic across repeated calls.
 *  - Property 3 (Req 8.1): haversineKm is symmetric in its two arguments.
 *  - Property 4 (Req 8.1, 8.2): haversineKm matches published great-circle
 *    distances for a fixed table of city pairs within 0.5%.
 *  - Property 5 (Req 8.3): walkingMinutes is monotonic non-decreasing and equals
 *    Math.round(distanceKm / WALKING_SPEED_KMH * 60).
 *
 * fast-check drives every property with >= 100 runs. Generators constrain to the
 * valid coordinate ranges (lat in [-90, 90], lng in [-180, 180]) and to finite
 * non-negative distances so both accept and boundary paths are exercised.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { Coordinates } from '../../types/geo'
import { WALKING_SPEED_KMH } from '../../types/geo'
import { haversineKm, walkingMinutes, computeDistance } from '../distanceService'

const NUM_RUNS = 200

// A valid coordinate: finite latitude in [-90, 90], finite longitude in [-180, 180].
const coordinate: fc.Arbitrary<Coordinates> = fc.record({
  latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
})

// A finite, non-negative distance in kilometers (0 up to a generous planet-scale cap).
const nonNegativeDistance: fc.Arbitrary<number> = fc.double({
  min: 0,
  max: 20037,
  noNaN: true,
  noDefaultInfinity: true,
})

// Fixed table of well-known city pairs with published great-circle distances (km).
// Each published value was cross-checked to be an accurate great-circle distance
// for the WGS84 decimal-degree coordinates below (mean-radius model).
const CITY_PAIRS: Array<{ name: string; a: Coordinates; b: Coordinates; publishedKm: number }> = [
  {
    name: 'London-Paris',
    a: { latitude: 51.5074, longitude: -0.1278 },
    b: { latitude: 48.8566, longitude: 2.3522 },
    publishedKm: 343.5,
  },
  {
    name: 'New York-Los Angeles',
    a: { latitude: 40.7128, longitude: -74.006 },
    b: { latitude: 34.0522, longitude: -118.2437 },
    publishedKm: 3936,
  },
  {
    name: 'Sydney-Melbourne',
    a: { latitude: -33.8688, longitude: 151.2093 },
    b: { latitude: -37.8136, longitude: 144.9631 },
    publishedKm: 714,
  },
  {
    name: 'Tokyo-Osaka',
    a: { latitude: 35.6895, longitude: 139.6917 },
    b: { latitude: 34.6937, longitude: 135.5023 },
    publishedKm: 396,
  },
  {
    name: 'Moscow-Berlin',
    a: { latitude: 55.7558, longitude: 37.6173 },
    b: { latitude: 52.52, longitude: 13.405 },
    publishedKm: 1609,
  },
]

describe('distanceService', () => {
  it('Feature: leaflet-maps-integration, Property 2: Distance is deterministic', () => {
    fc.assert(
      fc.property(coordinate, coordinate, (a, b) => {
        const first = computeDistance(a, b)
        // Repeated calls with the same inputs must return the same result.
        for (let i = 0; i < 3; i++) {
          expect(computeDistance(a, b)).toEqual(first)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Feature: leaflet-maps-integration, Property 3: Distance is symmetric', () => {
    fc.assert(
      fc.property(coordinate, coordinate, (a, b) => {
        const ab = haversineKm(a, b)
        const ba = haversineKm(b, a)
        // Symmetric within floating-point tolerance (relative to the magnitude).
        const tolerance = 1e-9 * (1 + Math.max(ab, ba))
        expect(Math.abs(ab - ba)).toBeLessThanOrEqual(tolerance)
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Feature: leaflet-maps-integration, Property 4: Distance calibration against known references', () => {
    fc.assert(
      fc.property(fc.constantFrom(...CITY_PAIRS), (pair) => {
        const computed = haversineKm(pair.a, pair.b)
        const relativeError = Math.abs(computed - pair.publishedKm) / pair.publishedKm
        // Within 0.5% of the published great-circle distance.
        expect(relativeError).toBeLessThanOrEqual(0.005)
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Feature: leaflet-maps-integration, Property 5: Walking time monotonic + formula', () => {
    fc.assert(
      fc.property(nonNegativeDistance, nonNegativeDistance, (x, y) => {
        const d1 = Math.min(x, y)
        const d2 = Math.max(x, y)
        // Monotonic non-decreasing: larger distance never yields fewer minutes.
        expect(walkingMinutes(d1)).toBeLessThanOrEqual(walkingMinutes(d2))
        // Formula: rounded distance / speed * 60.
        expect(walkingMinutes(d1)).toBe(Math.round((d1 / WALKING_SPEED_KMH) * 60))
        expect(walkingMinutes(d2)).toBe(Math.round((d2 / WALKING_SPEED_KMH) * 60))
      }),
      { numRuns: NUM_RUNS },
    )
  })

  // --- Concrete calibration checks (unit tests complement the property) ------ //
  it('matches each published city-pair distance within 0.5%', () => {
    for (const pair of CITY_PAIRS) {
      const computed = haversineKm(pair.a, pair.b)
      expect(Math.abs(computed - pair.publishedKm) / pair.publishedKm).toBeLessThanOrEqual(0.005)
    }
  })

  it('returns zero distance and zero walking time for identical points', () => {
    const p: Coordinates = { latitude: 12.9716, longitude: 77.5946 }
    expect(haversineKm(p, p)).toBe(0)
    expect(walkingMinutes(0)).toBe(0)
  })

  it('computeDistance bundles haversineKm and walkingMinutes', () => {
    const a: Coordinates = { latitude: 51.5074, longitude: -0.1278 }
    const b: Coordinates = { latitude: 48.8566, longitude: 2.3522 }
    const km = haversineKm(a, b)
    expect(computeDistance(a, b)).toEqual({ distanceKm: km, walkingMinutes: walkingMinutes(km) })
  })
})
