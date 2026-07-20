'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  APPROXIMATE_THRESHOLD,
  GEO_TIMEOUT_MS,
  type LocationServiceState,
} from '../types/geo'
import { validatePosition } from '../utils/geoValidation'

/** Maximum number of additional attempts allowed via `retry()` (Req 6.4). */
const MAX_RETRIES = 3

/** Initial, idle state before any location request is made. */
const INITIAL_STATE: LocationServiceState = {
  status: 'idle',
  position: null,
  isApproximate: false,
  error: null,
  retriesRemaining: MAX_RETRIES,
}

/**
 * One-shot browser geolocation hook with permission handling and graceful
 * degradation (Req 6). Wraps `navigator.geolocation.getCurrentPosition` with
 * `{ enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS }` (Req 6.1, 9.1),
 * routes every reading through the trust-boundary validator (Req 3.1, 3.2),
 * and never throws — all fallible paths surface a caught error state
 * (Req 13.6).
 *
 * State transitions by outcome:
 * - no `navigator.geolocation` → `unsupported` (Req 6.5)
 * - permission denied → `denied` (Req 6.3)
 * - no fix within the timeout → `timeout`, with `retry()` for up to 3
 *   additional attempts (Req 6.4)
 * - invalid reading (fails validation) or any other error → `error` (Req 3.2)
 * - valid reading → `success`, flagging `isApproximate` when the accuracy
 *   radius exceeds `APPROXIMATE_THRESHOLD` (Req 6.6)
 *
 * @returns an object with:
 *   - `state`: the current {@link LocationServiceState}
 *   - `requestLocation`: start a fresh request, resetting the retry budget to 3
 *   - `retry`: consume one retry attempt and re-request (no-op once exhausted)
 */
export function useLocationService(): {
  state: LocationServiceState
  requestLocation: () => void
  retry: () => void
} {
  const [state, setState] = useState<LocationServiceState>(INITIAL_STATE)
  // Mirror of retriesRemaining for synchronous guarding inside `retry`.
  const retriesRef = useRef<number>(MAX_RETRIES)
  // Guards against setState after unmount when a callback fires late.
  const mountedRef = useRef<boolean>(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const runRequest = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        status: 'unsupported',
        position: null,
        isApproximate: false,
        error: 'Geolocation is not supported by this browser',
      }))
      return
    }

    setState((prev) => ({ ...prev, status: 'requesting', error: null }))

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mountedRef.current) return
          const { latitude, longitude, accuracy } = pos.coords
          const result = validatePosition(latitude, longitude, accuracy, pos.timestamp)
          if (!result.ok) {
            setState((prev) => ({
              ...prev,
              status: 'error',
              position: null,
              isApproximate: false,
              error: result.error,
            }))
            return
          }
          setState((prev) => ({
            ...prev,
            status: 'success',
            position: result.value,
            isApproximate: result.value.accuracy > APPROXIMATE_THRESHOLD,
            error: null,
          }))
        },
        (err) => {
          if (!mountedRef.current) return
          setState((prev) => {
            if (err.code === err.PERMISSION_DENIED) {
              return {
                ...prev,
                status: 'denied',
                position: null,
                isApproximate: false,
                error: 'Location permission denied',
              }
            }
            if (err.code === err.TIMEOUT) {
              return {
                ...prev,
                status: 'timeout',
                position: null,
                isApproximate: false,
                error: 'Location request timed out',
              }
            }
            return {
              ...prev,
              status: 'error',
              position: null,
              isApproximate: false,
              error: 'Unable to determine location',
            }
          })
        },
        { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS }
      )
    } catch {
      // getCurrentPosition should not throw synchronously, but guard anyway so
      // no unhandled exception escapes the hook (Req 13.6).
      if (!mountedRef.current) return
      setState((prev) => ({
        ...prev,
        status: 'error',
        position: null,
        isApproximate: false,
        error: 'Unable to determine location',
      }))
    }
  }, [])

  const requestLocation = useCallback(() => {
    retriesRef.current = MAX_RETRIES
    setState((prev) => ({ ...prev, retriesRemaining: MAX_RETRIES }))
    runRequest()
  }, [runRequest])

  const retry = useCallback(() => {
    if (retriesRef.current <= 0) return
    retriesRef.current -= 1
    const remaining = retriesRef.current
    setState((prev) => ({ ...prev, retriesRemaining: remaining }))
    runRequest()
  }, [runRequest])

  return { state, requestLocation, retry }
}
