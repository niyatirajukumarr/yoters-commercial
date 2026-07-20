/**
 * Property tests for the Geolocation_Tracker's pure decision helper
 * (`decideTrackingUpdate` in `lib/hooks/useGeolocationTracker.ts`).
 *
 * The helper is pure (no React, no browser APIs), so it is exercised directly
 * with fast-check at >= 100 runs each.
 *
 *  - Property 7 (Req 9.4, 9.5): for an accuracy-accepted reading with a
 *    non-null last position, the helper commits if and only if the great-circle
 *    delta is >= DRIFT_THRESHOLD. `haversineKm` is used as the independent
 *    oracle for the delta.
 *  - Property 8 (Req 9.2): for any reading, the decision is 'rejected-accuracy'
 *    (and commit === false) if and only if next.accuracy > ACCURACY_THRESHOLD.
 *
 * Generators intentionally straddle both thresholds: close/far coordinate pairs
 * to bracket the 10 m drift boundary, and accuracy values on both sides of the
 * 100 m accuracy boundary (including exactly 100 and 100.0001).
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { ValidatedPosition } from '../../types/geo'
import { ACCURACY_THRESHOLD, DRIFT_THRESHOLD } from '../../types/geo'
import { haversineKm } from '../../utils/distanceService'
import { decideTrackingUpdate } from '../useGeolocationTracker'

const NUM_RUNS = 200

// Meters per degree of latitude (uniform with longitude, unlike east-west
// spacing which shrinks toward the poles). Offsetting in latitude lets us
// convert a metric offset to degrees independent of the base latitude.
const METERS_PER_DEG_LAT = 111_320

const timestamp = fc.integer({ min: 0, max: 4_102_444_800_000 })

// An accuracy radius that passes the accuracy gate (<= ACCURACY_THRESHOLD).
const acceptedAccuracy = fc.double({
  min: 0,
  max: ACCURACY_THRESHOLD,
  noNaN: true,
  noDefaultInfinity: true,
})

// A valid coordinate anywhere on the globe, away from the poles so a small
// latitude offset never overflows [-90, 90].
const midLatitude = fc.double({ min: -80, max: 80, noNaN: true, noDefaultInfinity: true })
const anyLongitude = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true })

/**
 * A { last, next } pair where BOTH readings pass the accuracy gate and last is
 * non-null. Two flavours are mixed so the drift delta lands on both sides of
 * DRIFT_THRESHOLD:
 *  - "close": next is a tiny metric offset (0-40 m) north of last, bracketing
 *    the 10 m boundary.
 *  - "far": two independent coordinates, almost always well beyond 10 m.
 */
const closePair = fc
  .record({
    baseLat: midLatitude,
    baseLng: anyLongitude,
    offsetMeters: fc.double({ min: 0, max: 40, noNaN: true, noDefaultInfinity: true }),
    lastAcc: acceptedAccuracy,
    nextAcc: acceptedAccuracy,
    ts1: timestamp,
    ts2: timestamp,
  })
  .map(({ baseLat, baseLng, offsetMeters, lastAcc, nextAcc, ts1, ts2 }) => {
    const last: ValidatedPosition = {
      latitude: baseLat,
      longitude: baseLng,
      accuracy: lastAcc,
      timestamp: ts1,
    }
    const next: ValidatedPosition = {
      latitude: baseLat + offsetMeters / METERS_PER_DEG_LAT,
      longitude: baseLng,
      accuracy: nextAcc,
      timestamp: ts2,
    }
    return { last, next }
  })

const farPair = fc
  .record({
    lat1: midLatitude,
    lng1: anyLongitude,
    lat2: midLatitude,
    lng2: anyLongitude,
    lastAcc: acceptedAccuracy,
    nextAcc: acceptedAccuracy,
    ts1: timestamp,
    ts2: timestamp,
  })
  .map(({ lat1, lng1, lat2, lng2, lastAcc, nextAcc, ts1, ts2 }) => {
    const last: ValidatedPosition = {
      latitude: lat1,
      longitude: lng1,
      accuracy: lastAcc,
      timestamp: ts1,
    }
    const next: ValidatedPosition = {
      latitude: lat2,
      longitude: lng2,
      accuracy: nextAcc,
      timestamp: ts2,
    }
    return { last, next }
  })

const acceptedPair = fc.oneof(closePair, farPair)

// Accuracy values straddling the 100 m gate: exactly at the boundary (accepted),
// just over (rejected), and a broad spread across and beyond the threshold.
const straddlingAccuracy = fc.oneof(
  fc.constant(ACCURACY_THRESHOLD),
  fc.constant(ACCURACY_THRESHOLD + 0.0001),
  fc.double({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
)

const positionWith = (accuracy: fc.Arbitrary<number>): fc.Arbitrary<ValidatedPosition> =>
  fc.record({
    latitude: midLatitude,
    longitude: anyLongitude,
    accuracy,
    timestamp,
  })

describe('decideTrackingUpdate', () => {
  it('Feature: leaflet-maps-integration, Property 7: Drift threshold gates marker/distance updates', () => {
    fc.assert(
      fc.property(acceptedPair, ({ last, next }) => {
        // Independent oracle for the great-circle delta in meters.
        const deltaMeters = haversineKm(last, next) * 1000
        const decision = decideTrackingUpdate(last, next)
        // With a non-null last and accuracy-accepted readings, commit iff the
        // movement is at least the drift threshold (below it is suppressed jitter).
        expect(decision.commit).toBe(deltaMeters >= DRIFT_THRESHOLD)
        expect(decision.reason).toBe(deltaMeters >= DRIFT_THRESHOLD ? 'accept' : 'suppressed-drift')
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('Feature: leaflet-maps-integration, Property 8: Accuracy threshold rejects imprecise readings', () => {
    fc.assert(
      fc.property(
        fc.option(positionWith(acceptedAccuracy), { nil: null }),
        positionWith(straddlingAccuracy),
        (last, next) => {
          const decision = decideTrackingUpdate(last, next)
          const shouldReject = next.accuracy > ACCURACY_THRESHOLD
          // Rejection happens exactly when accuracy is worse than the threshold.
          expect(decision.reason === 'rejected-accuracy').toBe(shouldReject)
          if (shouldReject) {
            expect(decision.commit).toBe(false)
          }
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })
})
