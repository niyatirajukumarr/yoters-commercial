'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ACCURACY_THRESHOLD,
  APPROXIMATE_THRESHOLD,
  DRIFT_THRESHOLD,
  STALE_MS,
  TRACK_DEBOUNCE_MS,
  type TrackingState,
  type ValidatedPosition,
} from '../types/geo'
import { validatePosition } from '../utils/geoValidation'
import { haversineKm } from '../utils/distanceService'

/**
 * Why a raw geolocation reading was accepted, rejected, or suppressed by the
 * tracking filter pipeline. Returned by {@link decideTrackingUpdate} so the
 * decision is inspectable and testable without React.
 *
 * - `first-fix`: no prior accepted position exists, so the reading is committed.
 * - `accept`: the reading passed the accuracy and drift gates and is committed.
 * - `rejected-accuracy`: accuracy radius worse than ACCURACY_THRESHOLD (Req 9.2).
 * - `suppressed-drift`: movement below DRIFT_THRESHOLD, treated as GPS jitter
 *   (Req 9.3-9.5).
 */
export type TrackingDecisionReason =
  | 'first-fix'
  | 'accept'
  | 'rejected-accuracy'
  | 'suppressed-drift'

/** Outcome of running one reading through the pure tracking filter pipeline. */
export interface TrackingDecision {
  /** True when the reading should update the stored/displayed position. */
  commit: boolean
  /** The reason for the commit/no-commit decision (see {@link TrackingDecisionReason}). */
  reason: TrackingDecisionReason
}

/**
 * Pure decision helper for the Geolocation_Tracker filter pipeline (Req 9.2-9.5).
 *
 * Given the last accepted position and a new, already-validated reading, it
 * decides whether the new reading should be committed as a position update.
 * It contains no React and no side effects, so it is fully unit- and
 * property-testable in isolation (Properties 7 & 8).
 *
 * Pipeline order:
 * 1. Reject when `next.accuracy > ACCURACY_THRESHOLD` (100 m) — imprecise
 *    reading, retain last (Req 9.2). This gate alone determines Property 8.
 * 2. Commit when there is no `last` accepted position yet (first fix).
 * 3. Suppress when the great-circle delta between `last` and `next` is
 *    `< DRIFT_THRESHOLD` (10 m) — GPS drift jitter (Req 9.3, 9.4).
 * 4. Otherwise commit — real movement of `DRIFT_THRESHOLD` or more (Req 9.5).
 *
 * For an accuracy-accepted reading with a non-null `last`, the reading is
 * committed if and only if the delta is `>= DRIFT_THRESHOLD` (Property 7).
 *
 * @param last the last accepted position, or `null` before any accepted fix
 * @param next a validated reading to evaluate against `last`
 * @returns a {@link TrackingDecision} carrying `commit` and the `reason`
 */
export function decideTrackingUpdate(
  last: ValidatedPosition | null,
  next: ValidatedPosition
): TrackingDecision {
  if (next.accuracy > ACCURACY_THRESHOLD) {
    return { commit: false, reason: 'rejected-accuracy' }
  }
  if (last === null) {
    return { commit: true, reason: 'first-fix' }
  }
  const deltaMeters = haversineKm(last, next) * 1000
  if (deltaMeters < DRIFT_THRESHOLD) {
    return { commit: false, reason: 'suppressed-drift' }
  }
  return { commit: true, reason: 'accept' }
}

/** Initial, inactive tracking state before any watch is registered. */
const INITIAL_STATE: TrackingState = {
  status: 'inactive',
  position: null,
  isApproximate: false,
  isStale: false,
  error: null,
}

/**
 * Continuous browser-geolocation tracking hook with a single-watch lifecycle
 * and noise filtering (Req 7, 9). While `active` and permission is granted it
 * maintains exactly one `navigator.geolocation.watchPosition` watch (Req 7.1,
 * 7.3), runs every reading through the trust-boundary validator (Req 3.1) and
 * the pure {@link decideTrackingUpdate} pipeline, and commits accepted updates
 * debounced to at most once per `TRACK_DEBOUNCE_MS` (Req 7.4).
 *
 * Lifecycle and cleanup (so zero watches/timers remain):
 * - unmount or `active === false` → `clearWatch`, timers cleared, status
 *   `inactive` (Req 7.2, 12.3).
 * - permission revoked or a position error while tracking → `clearWatch`,
 *   retain last position, status `stopped` with an error indication (Req 7.6).
 * - no accepted update within `STALE_MS` (30 s) → a watchdog flips `isStale`
 *   and status `stale`, retaining the last position (Req 7.7, 9.6); the
 *   watchdog is cleared on unmount (Req 12.3).
 *
 * Never throws — all fallible paths surface a caught error state (Req 13.6).
 *
 * @param active whether the map view wants live tracking to run
 * @returns the current {@link TrackingState} (last accepted position, flags,
 *   and error)
 */
export function useGeolocationTracker(active: boolean): TrackingState {
  const [state, setState] = useState<TrackingState>(INITIAL_STATE)

  // Guards setState after unmount when a late geolocation callback fires.
  const mountedRef = useRef<boolean>(true)
  // The last accepted (committed) position, used synchronously for drift gating.
  const lastAcceptedRef = useRef<ValidatedPosition | null>(null)
  // Epoch ms of the last commit, for the once-per-window debounce.
  const lastCommitTimeRef = useRef<number>(0)

  useEffect(() => {
    mountedRef.current = true

    if (!active) {
      // Not tracking: retain last position but mark inactive.
      setState((prev) => ({ ...prev, status: 'inactive', isStale: false, error: null }))
      return () => {
        mountedRef.current = false
      }
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        status: 'stopped',
        error: 'Geolocation is not supported by this browser',
      }))
      return () => {
        mountedRef.current = false
      }
    }

    const geolocation = navigator.geolocation
    let watchId: number | null = null
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null
    let pending: ValidatedPosition | null = null

    const clearDebounce = (): void => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
    }

    const clearWatchdog = (): void => {
      if (watchdogTimer !== null) {
        clearTimeout(watchdogTimer)
        watchdogTimer = null
      }
    }

    // (Re)arms the 30 s staleness watchdog; on expiry the last position is
    // retained and the state is flagged stale (Req 7.7, 9.6).
    const armWatchdog = (): void => {
      clearWatchdog()
      watchdogTimer = setTimeout(() => {
        watchdogTimer = null
        if (!mountedRef.current) return
        setState((prev) => ({ ...prev, status: 'stale', isStale: true }))
      }, STALE_MS)
    }

    // Applies an accepted reading to state and resets debounce/watchdog timing.
    const commit = (pos: ValidatedPosition): void => {
      lastAcceptedRef.current = pos
      lastCommitTimeRef.current = Date.now()
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          status: 'tracking',
          position: pos,
          isApproximate: pos.accuracy > APPROXIMATE_THRESHOLD,
          isStale: false,
          error: null,
        }))
      }
      armWatchdog()
    }

    // Commits at most once per TRACK_DEBOUNCE_MS: leading commit when the
    // window has elapsed, otherwise a single trailing commit of the latest
    // accepted reading at the window boundary (Req 7.4).
    const scheduleCommit = (pos: ValidatedPosition): void => {
      const elapsed = Date.now() - lastCommitTimeRef.current
      if (elapsed >= TRACK_DEBOUNCE_MS) {
        clearDebounce()
        pending = null
        commit(pos)
        return
      }
      pending = pos
      if (debounceTimer === null) {
        debounceTimer = setTimeout(() => {
          debounceTimer = null
          const next = pending
          pending = null
          if (next) commit(next)
        }, TRACK_DEBOUNCE_MS - elapsed)
      }
    }

    const onReading = (raw: GeolocationPosition): void => {
      if (!mountedRef.current) return
      const { latitude, longitude, accuracy } = raw.coords
      const validated = validatePosition(latitude, longitude, accuracy, raw.timestamp)
      if (!validated.ok) return // invalid reading dropped, retain last (Req 3.1)
      const decision = decideTrackingUpdate(lastAcceptedRef.current, validated.value)
      if (decision.commit) {
        scheduleCommit(validated.value)
      }
    }

    const onError = (err: GeolocationPositionError): void => {
      // Release the watch so zero watches remain, retain last position (Req 7.6).
      if (watchId !== null) {
        geolocation.clearWatch(watchId)
        watchId = null
      }
      clearDebounce()
      clearWatchdog()
      if (!mountedRef.current) return
      const denied = err.code === err.PERMISSION_DENIED
      setState((prev) => ({
        ...prev,
        status: 'stopped',
        isStale: false,
        error: denied
          ? 'Location permission revoked; live tracking stopped'
          : 'Live tracking stopped',
      }))
    }

    try {
      setState((prev) => ({ ...prev, status: 'tracking', isStale: false, error: null }))
      lastCommitTimeRef.current = 0 // ensure the first accepted fix commits immediately
      watchId = geolocation.watchPosition(onReading, onError, {
        enableHighAccuracy: true,
        timeout: STALE_MS,
      })
      armWatchdog()
    } catch {
      // watchPosition should not throw synchronously, but guard so no
      // unhandled exception escapes the hook (Req 13.6).
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, status: 'stopped', error: 'Live tracking stopped' }))
      }
    }

    return () => {
      mountedRef.current = false
      if (watchId !== null) {
        geolocation.clearWatch(watchId)
        watchId = null
      }
      clearDebounce()
      clearWatchdog()
    }
  }, [active])

  return state
}
