// @vitest-environment jsdom
/**
 * Lifecycle & cleanup example tests for the Geolocation_Tracker hook
 * (`lib/hooks/useGeolocationTracker.ts`).
 *
 * These are example/lifecycle tests (not property tests). They drive the hook
 * through `@testing-library/react`'s `renderHook` (already installed in
 * node_modules) inside a jsdom environment, with `navigator.geolocation`
 * replaced by a `vi.fn()` mock that captures the success/error callbacks so we
 * can invoke them with synthetic readings. `vi.useFakeTimers()` drives the
 * 3000 ms debounce (TRACK_DEBOUNCE_MS) and the 30 s stale watchdog (STALE_MS).
 *
 * Covers Requirement 7 (tracking lifecycle) and Req 9.6 / 12.3:
 *  - 7.1 / 7.3: exactly one `watchPosition` while active.
 *  - 7.2 / 12.3: `clearWatch` on unmount, zero watches + zero timers remaining.
 *  - 7.6: `clearWatch` on permission revocation / position error, last
 *    position retained, error surfaced.
 *  - 7.4: commits debounced to at most once per 3000 ms window.
 *  - 7.7 / 9.6: stale flip after 30 s, last position retained.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useGeolocationTracker } from '../useGeolocationTracker'
import { STALE_MS, TRACK_DEBOUNCE_MS } from '../../types/geo'

// Watch id the mocked watchPosition returns; clearWatch must be called with it.
const WATCH_ID = 42

let watchPosition: ReturnType<typeof vi.fn>
let clearWatch: ReturnType<typeof vi.fn>
let successCb: PositionCallback | null
let errorCb: PositionErrorCallback | null

/** Installs a fresh geolocation mock on navigator and resets captured callbacks. */
function installGeolocationMock(): void {
  successCb = null
  errorCb = null
  watchPosition = vi.fn(
    (s: PositionCallback, e?: PositionErrorCallback | null): number => {
      successCb = s
      errorCb = e ?? null
      return WATCH_ID
    }
  )
  clearWatch = vi.fn()
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: { watchPosition, clearWatch, getCurrentPosition: vi.fn() },
    configurable: true,
    writable: true,
  })
}

/** Delivers a synthetic GeolocationPosition through the captured success callback. */
function emit(latitude: number, longitude: number, accuracy: number): void {
  if (!successCb) throw new Error('watchPosition success callback not registered')
  const reading = {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as unknown as GeolocationPosition
  act(() => {
    successCb!(reading)
  })
}

/** Delivers a synthetic GeolocationPositionError through the captured error callback. */
function emitError(code: number): void {
  if (!errorCb) throw new Error('watchPosition error callback not registered')
  const err = {
    code,
    message: '',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as unknown as GeolocationPositionError
  act(() => {
    errorCb!(err)
  })
}

// Two positions ~11 m apart (> DRIFT_THRESHOLD of 10 m): 0.0001 deg lat ≈ 11.1 m.
const A = { lat: 13.0843, lng: 77.4873, acc: 20 }
const B = { lat: 13.0844, lng: 77.4873, acc: 20 }
const C = { lat: 13.0845, lng: 77.4873, acc: 20 }

beforeEach(() => {
  vi.useFakeTimers()
  installGeolocationMock()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useGeolocationTracker lifecycle', () => {
  it('registers exactly one watchPosition while active (Req 7.1, 7.3)', () => {
    const { result } = renderHook(() => useGeolocationTracker(true))
    expect(watchPosition).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('tracking')
  })

  it('does not register a watch while inactive', () => {
    const { result } = renderHook(() => useGeolocationTracker(false))
    expect(watchPosition).not.toHaveBeenCalled()
    expect(result.current.status).toBe('inactive')
  })

  it('calls clearWatch on unmount leaving zero watches and zero timers (Req 7.2, 12.3)', () => {
    const { unmount } = renderHook(() => useGeolocationTracker(true))
    emit(A.lat, A.lng, A.acc) // first fix -> arms the 30 s watchdog
    expect(watchPosition).toHaveBeenCalledTimes(1)

    unmount()

    expect(clearWatch).toHaveBeenCalledTimes(1)
    expect(clearWatch).toHaveBeenCalledWith(WATCH_ID)
    // Watchdog (and any debounce) timer must be cleared on unmount.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not flip stale after unmount (watchdog cleared) (Req 12.3)', () => {
    const { result, unmount } = renderHook(() => useGeolocationTracker(true))
    emit(A.lat, A.lng, A.acc)
    unmount()
    act(() => {
      vi.advanceTimersByTime(STALE_MS * 2)
    })
    // State is frozen at the last committed value; it must not become stale.
    expect(result.current.status).toBe('tracking')
    expect(result.current.isStale).toBe(false)
  })

  it('clears the watch on permission revocation and retains the last position (Req 7.6)', () => {
    const { result } = renderHook(() => useGeolocationTracker(true))
    emit(A.lat, A.lng, A.acc)
    expect(result.current.position).toMatchObject({ latitude: A.lat, longitude: A.lng })

    emitError(1) // PERMISSION_DENIED

    expect(clearWatch).toHaveBeenCalledTimes(1)
    expect(clearWatch).toHaveBeenCalledWith(WATCH_ID)
    expect(result.current.status).toBe('stopped')
    expect(result.current.error).toMatch(/revoked/i)
    // Last known position retained.
    expect(result.current.position).toMatchObject({ latitude: A.lat, longitude: A.lng })
  })

  it('clears the watch on a position error and retains the last position (Req 7.6)', () => {
    const { result } = renderHook(() => useGeolocationTracker(true))
    emit(A.lat, A.lng, A.acc)

    emitError(2) // POSITION_UNAVAILABLE

    expect(clearWatch).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('stopped')
    expect(result.current.error).toBeTruthy()
    expect(result.current.position).toMatchObject({ latitude: A.lat, longitude: A.lng })
  })

  it('debounces commits to at most once per 3000 ms window (Req 7.4)', () => {
    const { result } = renderHook(() => useGeolocationTracker(true))

    // First fix commits immediately (leading edge).
    emit(A.lat, A.lng, A.acc)
    expect(result.current.position).toMatchObject({ latitude: A.lat, longitude: A.lng })

    // Two further accepted readings inside the same window must NOT commit yet.
    emit(B.lat, B.lng, B.acc)
    emit(C.lat, C.lng, C.acc)
    expect(result.current.position).toMatchObject({ latitude: A.lat, longitude: A.lng })

    // At the window boundary a single trailing commit applies the latest reading.
    act(() => {
      vi.advanceTimersByTime(TRACK_DEBOUNCE_MS)
    })
    expect(result.current.position).toMatchObject({ latitude: C.lat, longitude: C.lng })
    expect(result.current.status).toBe('tracking')
  })

  it('flips to stale after 30 s with no update, retaining the last position (Req 7.7, 9.6)', () => {
    const { result } = renderHook(() => useGeolocationTracker(true))
    emit(A.lat, A.lng, A.acc)
    expect(result.current.isStale).toBe(false)

    act(() => {
      vi.advanceTimersByTime(STALE_MS)
    })

    expect(result.current.status).toBe('stale')
    expect(result.current.isStale).toBe(true)
    expect(result.current.position).toMatchObject({ latitude: A.lat, longitude: A.lng })
  })
})
