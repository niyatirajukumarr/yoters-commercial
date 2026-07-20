/**
 * Tests for the trust-boundary coordinate validator (`lib/utils/geoValidation.ts`).
 *
 * Property 1 (Requirements 3.1, 3.2): the validator accepts a reading if and
 * only if latitude is finite in [-90, 90], longitude is finite in [-180, 180],
 * and (where accuracy is validated) accuracy is finite and >= 0. The property
 * test drives arbitrary numbers — including NaN, +/-Infinity, and out-of-range
 * values — and checks the accept/reject decision against an independent oracle
 * computed from the same range predicates.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  isValidLatitude,
  isValidLongitude,
  isValidAccuracy,
  validateCoordinates,
  validatePosition,
} from '../geoValidation'

// --- Independent oracle (does not import the module's predicates) ---------- //
const isFiniteNum = (n: number): boolean =>
  typeof n === 'number' && Number.isFinite(n)
const oracleLat = (n: number): boolean => isFiniteNum(n) && n >= -90 && n <= 90
const oracleLng = (n: number): boolean => isFiniteNum(n) && n >= -180 && n <= 180
const oracleAcc = (n: number): boolean => isFiniteNum(n) && n >= 0

// A number arbitrary that mixes full-range doubles (which already include NaN
// and +/-Infinity), explicit special values, and values biased into the valid
// latitude/longitude/accuracy ranges so both accept and reject paths are hit.
const anyNumber: fc.Arbitrary<number> = fc.oneof(
  fc.double(),
  fc.constantFrom(NaN, Infinity, -Infinity, 0, -0, 90, -90, 180, -180, 90.0000001, -180.0000001),
  fc.double({ min: -90, max: 90, noNaN: true }),
  fc.double({ min: -180, max: 180, noNaN: true }),
  fc.double({ min: 0, max: 1000, noNaN: true }),
)

describe('geoValidation', () => {
  it('Feature: leaflet-maps-integration, Property 1: Coordinate validation accepts exactly the valid range', () => {
    fc.assert(
      fc.property(anyNumber, anyNumber, anyNumber, (latitude, longitude, accuracy) => {
        // Per-field predicates match the oracle.
        expect(isValidLatitude(latitude)).toBe(oracleLat(latitude))
        expect(isValidLongitude(longitude)).toBe(oracleLng(longitude))
        expect(isValidAccuracy(accuracy)).toBe(oracleAcc(accuracy))

        // validateCoordinates accepts iff lat and lng are both valid.
        const coordsExpected = oracleLat(latitude) && oracleLng(longitude)
        const coords = validateCoordinates(latitude, longitude)
        expect(coords.ok).toBe(coordsExpected)
        if (coords.ok) {
          expect(coords.value).toEqual({ latitude, longitude })
        }

        // validatePosition accepts iff lat, lng AND accuracy are all valid.
        const posExpected = coordsExpected && oracleAcc(accuracy)
        const pos = validatePosition(latitude, longitude, accuracy, 1234)
        expect(pos.ok).toBe(posExpected)
        if (pos.ok) {
          expect(pos.value).toEqual({ latitude, longitude, accuracy, timestamp: 1234 })
        }
      }),
      { numRuns: 1000 },
    )
  })

  // --- Concrete edge cases (unit tests complement the property) ------------ //
  it('accepts the inclusive boundaries', () => {
    expect(validatePosition(90, 180, 0).ok).toBe(true)
    expect(validatePosition(-90, -180, 0).ok).toBe(true)
  })

  it('rejects just-out-of-range latitude/longitude', () => {
    expect(validateCoordinates(90.0001, 0).ok).toBe(false)
    expect(validateCoordinates(0, -180.0001).ok).toBe(false)
  })

  it('rejects NaN and +/-Infinity in every field', () => {
    expect(validateCoordinates(NaN, 0).ok).toBe(false)
    expect(validateCoordinates(0, Infinity).ok).toBe(false)
    expect(validatePosition(0, 0, -Infinity).ok).toBe(false)
    expect(validatePosition(0, 0, NaN).ok).toBe(false)
  })

  it('rejects negative accuracy but accepts zero', () => {
    expect(isValidAccuracy(-0.0001)).toBe(false)
    expect(isValidAccuracy(0)).toBe(true)
  })
})
