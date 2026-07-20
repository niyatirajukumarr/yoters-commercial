/**
 * Property tests for the tracker's pure decision helper
 * (`decideTrackingUpdate` in `lib/hooks/useGeolocationTracker.ts`).
 *
 * These cover the two numeric gates of the noise-filtering pipeline that are
 * amenable to property-based testing:
 *  - Property 7 (Req 9.4, 9.5): the drift threshold gates marker/distance
 *    updates. For an accuracy-accepted reading with a non-null last position,
 *    the tracker commits iff the great-circle delta is >= DRIFT_THRESHOLD (10 m).
 *  - Property 8 (Req 9.2): the accuracy threshold rejects imprecise readings.
 *    A reading is ignored (retaining the last position) iff its accuracy radius
 *    is worse than ACCURACY_THRESHOLD (100 m).
 *
 * fast-check drives every property with >= 100 runs. `haversineKm` is used as
 * the independent oracle for the great-circle delta (converted km -> m), as the
 * task allows. Property 7 constructs positions with a controlled offset so the
 * generated deltas straddle the 10 m boundary rather than landing far apart.
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { ACCURACY_THRESHOLD, DRIFT_THRESHOLD, type ValidatedPosition } from '../../types/geo'
import { haversineKm } from '../../utils/distanceService'
import { decideTrackingUpdate } from '../useGeolocationTracker'

const NUM_RUNS = 200

/** Meters per degree of latitude (WGS84 mean), used to build controlled offsets. */
const METERS_PER_DEG_LAT = 111320

describe('useGeolocationTracker/decideTrackingUpdate', () => {
  it('Feature: leaflet-maps-integration, Property 7: Drift threshold gates marker/distance updates', () => {
    fc.assert(
      fc.property(
        // Base position kept away from the poles so a latitude offset stays valid.
        fc.double({ min: -80, max: 80, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        // Offset in meters straddling DRIFT_THRESHOLD (10 m) on both sides.
        fc.double({ min: 0, max: 30, noNaN: true, noDefaultInfinity: true }),
        // Both readings accuracy-accepted (<= 100 m) so only the drift gate applies.
        fc.double({ min: 0, max: ACCURACY_THRESHOLD, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: ACCURACY_THRESHOLD, noNaN: true, noDefaultInfinity: true }),
        (baseLat, baseLng, offsetMeters, lastAcc, nextAcc) => {
          const last: ValidatedPosition = {
            latitude: baseLat,
            longitude: baseLng,
            accuracy: lastAcc,
            timestamp: 0,
          }
          const next: ValidatedPosition = {
            latitude: baseLat + offsetMeters / METERS_PER_DEG_LAT,
            longitude: baseLng,
            accuracy: nextAcc,
            timestamp: 1,
          }

          // Independent oracle for the great-circle delta in meters.
          const deltaMeters = haversineKm(last, next) * 1000
          const expectedCommit = deltaMeters >= DRIFT_THRESHOLD

          const decision = decideTrackingUpdate(last, next)
          expect(decision.commit).toBe(expectedCommit)
          expect(decision.reason).toBe(expectedCommit ? 'accept' : 'suppressed-drift')
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })

  it('Feature: leaflet-maps-integration, Property 8: Accuracy threshold rejects imprecise readings', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        // Accuracy straddling ACCURACY_THRESHOLD (100 m) on both sides.
        fc.double({ min: 0, max: 2 * ACCURACY_THRESHOLD, noNaN: true, noDefaultInfinity: true }),
        (latitude, longitude, accuracy) => {
          const next: ValidatedPosition = { latitude, longitude, accuracy, timestamp: 0 }

          // With no prior accepted position, the drift gate cannot apply, so the
          // outcome is decided purely by the accuracy gate: ignored iff acc > 100.
          const decision = decideTrackingUpdate(null, next)
          const rejectedForAccuracy = accuracy > ACCURACY_THRESHOLD

          expect(decision.reason === 'rejected-accuracy').toBe(rejectedForAccuracy)
          expect(decision.commit).toBe(!rejectedForAccuracy)
          if (!rejectedForAccuracy) {
            // Accuracy-accepted first reading is committed as the first fix.
            expect(decision.reason).toBe('first-fix')
          }
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })

  // --- Concrete boundary checks complement the properties -------------------- //
  // Offsets are set clearly on either side of DRIFT_THRESHOLD so the outcome is
  // unambiguous regardless of the small difference between METERS_PER_DEG_LAT and
  // the haversine mean-radius conversion used inside the helper.
  it('commits above the drift threshold and suppresses below it', () => {
    const base: ValidatedPosition = { latitude: 13.0, longitude: 77.0, accuracy: 5, timestamp: 0 }
    const aboveThreshold: ValidatedPosition = {
      ...base,
      latitude: base.latitude + (DRIFT_THRESHOLD + 5) / METERS_PER_DEG_LAT,
      timestamp: 1,
    }
    const belowThreshold: ValidatedPosition = {
      ...base,
      latitude: base.latitude + (DRIFT_THRESHOLD - 5) / METERS_PER_DEG_LAT,
      timestamp: 1,
    }
    expect(decideTrackingUpdate(base, aboveThreshold)).toEqual({ commit: true, reason: 'accept' })
    expect(decideTrackingUpdate(base, belowThreshold)).toEqual({
      commit: false,
      reason: 'suppressed-drift',
    })
  })

  it('accepts accuracy exactly at the threshold and rejects just above it', () => {
    const p = (accuracy: number): ValidatedPosition => ({
      latitude: 13,
      longitude: 77,
      accuracy,
      timestamp: 0,
    })
    // 100 is not "worse than" 100, so it is accepted.
    expect(decideTrackingUpdate(null, p(ACCURACY_THRESHOLD)).reason).toBe('first-fix')
    expect(decideTrackingUpdate(null, p(ACCURACY_THRESHOLD + 0.1))).toEqual({
      commit: false,
      reason: 'rejected-accuracy',
    })
  })
})
