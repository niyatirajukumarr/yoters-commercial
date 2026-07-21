'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  DivIcon,
  LatLngBoundsExpression,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DistanceResult, RestaurantMapProps } from '../lib/types/geo'
import { getLethafiLocation } from '../lib/utils/lethafiLocation'
import { useGeolocationTracker } from '../lib/hooks/useGeolocationTracker'
import { useLocationService } from '../lib/hooks/useLocationService'
import { computeDistance } from '../lib/utils/distanceService'
import { drivingMinutes, fetchRoute } from '../lib/utils/geocodingClient'

/**
 * The `leaflet` module surface, resolved at runtime via `(await
 * import('leaflet')).default`. `@types/leaflet` declares its API as named
 * module exports (with `export as namespace L`) and no `default` member, so the
 * module namespace type itself describes the runtime object — indexing
 * `['default']` on the type is invalid even though the value-level `.default`
 * access is valid under `esModuleInterop`.
 */
type LeafletModule = typeof import('leaflet')

// Diameter in meters of the area kept visible when only the restaurant marker
// exists, so a 500 m radius around it stays on screen (Req 10.3).
const RESTAURANT_ONLY_VIEW_METERS = 1000

// Edge padding (px) applied when fitting both markers into view (Req 10.2).
const FIT_PADDING: [number, number] = [40, 40]

// Max user-marker move animation duration in seconds; kept <= 500ms (Req 7.5).
const MOVE_ANIMATE_SECONDS = 0.5

// Minimum gap (ms) between distance/travel-time recomputes while tracking, so
// rapid position updates recompute at most once per second (Req 8.8).
const RECOMPUTE_THROTTLE_MS = 1000

// Zoom level applied when recentering on the user position (Req 10.4).
const USER_FOCUS_ZOOM = 16

// Max time (ms) allowed for the map to reach the ready state before flipping to
// the error+retry state; also the ceiling on init/data retrieval (Req 10.9, 10.10).
const LOAD_TIMEOUT_MS = 10000

/**
 * Marker icon for the restaurant, built with PER-INSTANCE options so the
 * global `L.Icon.Default` is never mutated (regression mitigation §1.5 —
 * `DeliveryMapModal` relies on that global). A red teardrop pin.
 */
function makeRestaurantIcon(L: LeafletModule): DivIcon {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#e23744;' +
      'border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);transform:rotate(-45deg)"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  })
}

/**
 * Marker icon for the live user position — visually distinct from the
 * restaurant pin (a blue dot), also PER-INSTANCE so the global default icon
 * stays untouched (regression mitigation §1.5).
 */
function makeUserIcon(L: LeafletModule): DivIcon {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:18px;height:18px;border-radius:50%;background:#2a7de1;' +
      'border:3px solid #fff;box-shadow:0 0 0 2px rgba(42,125,225,0.4)"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

/**
 * Lazy Leaflet map for the order-tracking view (Map_Component).
 *
 * Core responsibilities (task 7.1):
 * - Dynamically imports Leaflet on mount so it never enters SSR or a host's
 *   initial bundle (Req 12.1); adds an OSM tile layer with `attributionControl`
 *   enabled so attribution is always visible and legible (Req 11.2).
 * - Places a restaurant marker at the validated Lethafi location; when that
 *   location is missing/invalid it shows a "restaurant location unavailable"
 *   indication and places no restaurant marker (Req 5.4, 5.5).
 * - Drives a visually distinct user marker from {@link useGeolocationTracker};
 *   fits both markers into view with >= 40px edge padding (Req 10.2), or keeps
 *   a 500 m radius visible when only the restaurant marker exists (Req 10.3).
 *   Subsequent tracked moves animate <= 500ms ending centered on the reported
 *   coordinates (Req 7.5).
 * - On unmount tears down the map, its listeners, and any timers so nothing
 *   leaks (Req 12.3).
 *
 * All fallible operations are caught and surfaced as state — the component
 * never throws (Req 13.6).
 *
 * Adds (task 7.2): distance/walking/driving readouts throttled to <=1/s during
 * tracking (Req 8.2-8.8), current-location and recenter controls (Req 10.4-10.6),
 * and the optional `showRoute` path via the Routing_Provider (Req 10.7, 10.8).
 * Loading/error/retry/approximate/stale and full-a11y polish (task 7.3) extend
 * this core; the refs and `error`/`ready` state are the hook points.
 *
 * @param props see {@link RestaurantMapProps}; `restaurant` defaults to the
 *   validated Lethafi location.
 */
export default function RestaurantMap({ restaurant, showRoute, className }: RestaurantMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<LeafletModule | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const restaurantMarkerRef = useRef<LeafletMarker | null>(null)
  const userMarkerRef = useRef<LeafletMarker | null>(null)
  // The optional Routing_Provider path drawn between the user and restaurant
  // (Req 10.7); replaced on each update and torn down on unmount (Req 12.3).
  const routeLayerRef = useRef<LeafletPolyline | null>(null)
  // Pending throttled recompute timer, cleared on change/unmount (Req 8.8, 12.3).
  const recomputeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Epoch ms of the last distance recompute, for the once-per-second throttle.
  const lastComputeRef = useRef<number>(0)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Computed distance/travel-time for display, or null when inputs are missing
  // (Req 8.7). `drivingMinutes` is merged in only when routing succeeds (Req 8.5).
  const [distance, setDistance] = useState<DistanceResult | null>(null)
  // Transient indication when a control cannot act (e.g. current-location with
  // no user position, Req 10.6).
  const [controlError, setControlError] = useState<string | null>(null)
  // Set when the optional route path could not be retrieved (Req 10.8).
  const [routeUnavailable, setRouteUnavailable] = useState(false)
  // Bumped by the retry control; adding it to the init effect deps re-runs
  // initialization + data retrieval cleanly after a failure/timeout (Req 10.10, 12.2).
  const [retryCount, setRetryCount] = useState(0)

  // Restaurant coordinates resolve synchronously from the prop or the store.
  // Memoized on the prop so the reference is stable across renders — it sits in
  // several effect dependency arrays, and an unstable object would re-run those
  // effects (and the throttled recompute) on every render (Req 8.8, 12.5).
  const resolvedRestaurant = useMemo(() => restaurant ?? getLethafiLocation(), [restaurant])
  const restaurantUnavailable = resolvedRestaurant === null

  // ponytail: live tracking runs on mount for the core view; task 7.2 adds the
  // start/stop control that will own this flag.
  const tracking = useGeolocationTracker(true)
  // One-shot service backing the current-location button when no live fix
  // exists yet (Req 10.4); the tracker's live position drives everything else.
  const location = useLocationService()

  // Best available user position: prefer the live tracked fix, else the last
  // one-shot fix from the location service.
  const userPosition = tracking.position ?? location.state.position

  // --- Map init + restaurant marker + disposal (re-runs on retry) ---------
  // `retryCount` is the only dependency: bumping it tears down any prior map
  // instance (cleanup below) and rebuilds from scratch, so the retry control
  // re-attempts initialization cleanly without double-init or leaks (Req 12.2, 12.3).
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const L = (await import('leaflet')).default
        if (cancelled || !containerRef.current) return
        leafletRef.current = L

        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true, // attribution always visible/legible (Req 11.2)
        })
        mapRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        if (resolvedRestaurant) {
          const rLatLng: [number, number] = [resolvedRestaurant.latitude, resolvedRestaurant.longitude]
          restaurantMarkerRef.current = L.marker(rLatLng, {
            icon: makeRestaurantIcon(L),
            title: 'Restaurant',
          }).addTo(map)
          // Restaurant-only view: keep a 500 m radius visible (Req 10.3).
          map.fitBounds(L.latLng(rLatLng).toBounds(RESTAURANT_ONLY_VIEW_METERS), { padding: FIT_PADDING })
        } else {
          // ponytail: no restaurant and no user fix yet — neutral world view;
          // the tracking effect recenters once a user position arrives.
          map.setView([20, 0], 2)
        }

        // Clear any prior/timeout error so a late-but-successful init recovers
        // cleanly rather than leaving a stale error banner over a working map.
        setError(null)
        setReady(true)
      } catch {
        // Never throw from init (Req 13.6); surface as the error+retry state.
        // Covers Leaflet dynamic-import / asset-load failure (Req 10.10, 12.2).
        if (!cancelled) setError('The map failed to load')
      }
    }

    init()

    return () => {
      cancelled = true
      const map = mapRef.current
      if (map) {
        map.off() // detach all listeners (Req 12.3)
        map.remove() // dispose DOM, layers, and Leaflet's internal animation timers
      }
      mapRef.current = null
      leafletRef.current = null
      restaurantMarkerRef.current = null
      userMarkerRef.current = null
    }
    // Runs on mount and again on each retry (retryCount). The cleanup above
    // disposes the prior map (map.remove() also frees the container's Leaflet
    // id) so re-init on the same, now-empty container never crashes (Req 12.2).
    // resolvedRestaurant is stable for a given prop set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount])

  // --- User marker create/update from live tracking -----------------------
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const pos = tracking.position
    if (!ready || !L || !map || !pos) return

    const latLng: [number, number] = [pos.latitude, pos.longitude]

    if (!userMarkerRef.current) {
      // First fix: drop the distinct user marker and frame both markers.
      userMarkerRef.current = L.marker(latLng, { icon: makeUserIcon(L), title: 'Your location' }).addTo(map)
      if (resolvedRestaurant) {
        const bounds: LatLngBoundsExpression = [
          [resolvedRestaurant.latitude, resolvedRestaurant.longitude],
          latLng,
        ]
        map.fitBounds(L.latLngBounds(bounds), { padding: FIT_PADDING }) // both visible, >=40px (Req 10.2)
      } else {
        map.setView(latLng, 16)
      }
      return
    }

    // Subsequent moves: reposition and animate-pan <= 500ms ending centered
    // on the reported coordinates (Req 7.5).
    userMarkerRef.current.setLatLng(latLng)
    map.panTo(latLng, { animate: true, duration: MOVE_ANIMATE_SECONDS })
  }, [ready, tracking.position, resolvedRestaurant])

  // --- Distance + travel-time recompute (throttled to <=1/s, Req 8.8) ------
  useEffect(() => {
    let cancelled = false
    const pos = tracking.position

    const compute = (): void => {
      if (cancelled) return
      lastComputeRef.current = Date.now()
      if (!pos || !resolvedRestaurant) {
        // Either endpoint missing: omit distance/travel-time (Req 8.7).
        setDistance(null)
        return
      }
      // computeDistance is memoized on rounded inputs, so unchanged coordinates
      // reuse the prior result rather than recomputing (Req 12.5).
      const result = computeDistance(pos, resolvedRestaurant)
      setDistance(result)
      // Driving time is async and shown ONLY when routing succeeds; on failure
      // or timeout it is omitted rather than shown wrong (Req 8.4, 8.5, 8.6).
      void (async () => {
        const res = await drivingMinutes(pos, resolvedRestaurant)
        if (cancelled || !res.ok) return
        setDistance((prev) => (prev ? { ...prev, drivingMinutes: res.value } : prev))
      })()
    }

    const elapsed = Date.now() - lastComputeRef.current
    if (elapsed >= RECOMPUTE_THROTTLE_MS) {
      compute()
    } else {
      recomputeTimerRef.current = setTimeout(compute, RECOMPUTE_THROTTLE_MS - elapsed)
    }

    return () => {
      cancelled = true
      if (recomputeTimerRef.current !== null) {
        clearTimeout(recomputeTimerRef.current)
        recomputeTimerRef.current = null
      }
    }
  }, [tracking.position, resolvedRestaurant])

  // --- Optional route path via Routing_Provider (Req 10.7, 10.8) -----------
  useEffect(() => {
    if (!showRoute) return
    const L = leafletRef.current
    const map = mapRef.current
    const pos = tracking.position
    if (!ready || !L || !map || !pos || !resolvedRestaurant) return

    let cancelled = false
    void (async () => {
      const res = await fetchRoute(pos, resolvedRestaurant)
      if (cancelled || !mapRef.current) return
      if (!res.ok) {
        // Failure: flag route unavailable but keep markers/view usable (Req 10.8).
        setRouteUnavailable(true)
        return
      }
      setRouteUnavailable(false)
      // Replace any prior route line before drawing the fresh geometry.
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
        routeLayerRef.current = null
      }
      routeLayerRef.current = L.polyline(res.value.points, {
        color: '#2a7de1',
        weight: 4,
        opacity: 0.7,
      }).addTo(map)
    })()

    return () => {
      cancelled = true
    }
  }, [showRoute, ready, tracking.position, resolvedRestaurant])

  // --- Route layer teardown on unmount (Req 12.3) --------------------------
  useEffect(() => {
    return () => {
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
        routeLayerRef.current = null
      }
    }
  }, [])

  // --- 10s load watchdog: flip to the error+retry state if the map has not
  // become ready within LOAD_TIMEOUT_MS (Req 10.9, 10.10). Re-armed on each
  // retry; cleared on unmount so no timer leaks (Req 12.3).
  useEffect(() => {
    if (ready || error) return
    const timer = setTimeout(() => {
      setError('The map is taking too long to load')
    }, LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [ready, error, retryCount])

  // Re-attempt map initialization AND data retrieval. Resets the transient
  // state and bumps retryCount so the init effect re-runs after its cleanup
  // has disposed the previous map — never crashes the host (Req 10.10, 12.2).
  const handleRetry = (): void => {
    setError(null)
    setReady(false)
    setControlError(null)
    setRouteUnavailable(false)
    setRetryCount((n) => n + 1)
  }

  // Approximate reading from either source (Req 6.6) and a stale/outdated
  // position from the tracker (Req 7.7, 9.6) — surfaced as text indicators.
  const isApproximate = tracking.isApproximate || location.state.isApproximate
  const isStale = tracking.isStale || tracking.status === 'stale'

  // Recenter the map on the user position (Req 10.4). When no position is
  // available, show an error indication and leave the view unchanged (Req 10.6).
  const handleCurrentLocation = (): void => {
    const map = mapRef.current
    if (!map) return
    if (!userPosition) {
      setControlError('Your location is unavailable')
      // Kick off a one-shot request so a subsequent press can succeed.
      location.requestLocation()
      return
    }
    setControlError(null)
    map.setView(
      [userPosition.latitude, userPosition.longitude],
      Math.max(map.getZoom(), USER_FOCUS_ZOOM),
      { animate: true }
    )
  }

  // Fit both the restaurant and user markers into view (Req 10.5); falls back
  // to whichever single point exists.
  const handleRecenter = (): void => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return
    if (resolvedRestaurant && userPosition) {
      const bounds: LatLngBoundsExpression = [
        [resolvedRestaurant.latitude, resolvedRestaurant.longitude],
        [userPosition.latitude, userPosition.longitude],
      ]
      map.fitBounds(L.latLngBounds(bounds), { padding: FIT_PADDING })
    } else if (resolvedRestaurant) {
      const rLatLng: [number, number] = [resolvedRestaurant.latitude, resolvedRestaurant.longitude]
      map.fitBounds(L.latLng(rLatLng).toBounds(RESTAURANT_ONLY_VIEW_METERS), { padding: FIT_PADDING })
    } else if (userPosition) {
      map.setView([userPosition.latitude, userPosition.longitude], USER_FOCUS_ZOOM)
    }
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative', width: '100%', maxWidth: '100%', height: '100%',
        minHeight: 280, boxSizing: 'border-box', overflow: 'hidden',
      }}
    >
      {/* Scoped styles: theme-aware overlay contrast (>=4.5:1 text, >=3:1
          non-text in light and dark, Req 11.3) and a visible focus indicator
          (>=3:1, Req 11.6). Dark mode follows the OS preference since the app
          ships a single light `:root` theme with no `.dark` toggle. */}
      <style>{`
        .rm-panel {
          box-sizing: border-box;
          max-width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.35;
          background: rgba(255,255,255,0.97);
          color: #1a1f2e;
          border: 1px solid #b7bcc9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        }
        .rm-btn {
          box-sizing: border-box;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          background: rgba(255,255,255,0.97);
          color: #1a1f2e;
          border: 1px solid #b7bcc9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        }
        .rm-btn--text {
          width: auto;
          height: auto;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
        }
        .rm-btn:focus-visible {
          outline: 3px solid #1a73e8;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px #ffffff, 0 1px 4px rgba(0,0,0,0.18);
        }
        .rm-directions-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          text-decoration: none;
          font-weight: 600;
          color: #1a73e8;
        }
        .rm-directions-link:hover { background: rgba(26,115,232,0.08); }
        .rm-directions-link:focus-visible {
          outline: 3px solid #1a73e8;
          outline-offset: 2px;
        }
        .rm-spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(26,31,46,0.25);
          border-top-color: #1a1f2e;
          border-radius: 50%;
          animation: rm-spin 0.9s linear infinite;
        }
        @keyframes rm-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .rm-spinner { animation-duration: 2.4s; }
        }
        @media (prefers-color-scheme: dark) {
          .rm-panel, .rm-btn {
            background: rgba(26,28,34,0.97);
            color: #f4f5f8;
            border-color: #565b68;
            box-shadow: 0 1px 4px rgba(0,0,0,0.5);
          }
          .rm-btn:focus-visible {
            box-shadow: 0 0 0 2px #000000, 0 1px 4px rgba(0,0,0,0.5);
          }
          .rm-spinner {
            border-color: rgba(244,245,248,0.3);
            border-top-color: #f4f5f8;
          }
        }
      `}</style>

      <div ref={containerRef} style={{ width: '100%', maxWidth: '100%', height: '100%', minHeight: 280, boxSizing: 'border-box' }} />

      {/* Loading state while initializing and under the 10s ceiling (Req 10.9).
          Text label ensures the state is not conveyed by motion/color alone
          (Req 11.7). */}
      {!ready && !error && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute', inset: 0, zIndex: 500,
            display: 'flex', flexDirection: 'column', gap: 10,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div className="rm-spinner" aria-hidden="true" />
          <span className="rm-panel">Loading map…</span>
        </div>
      )}

      {restaurantUnavailable && (
        <div
          role="status"
          className="rm-panel"
          style={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 500 }}
        >
          ⚠️ Restaurant location unavailable
        </div>
      )}

      {/* Error state with a RETRY control that re-attempts init + data
          retrieval without crashing the host (Req 10.10, 12.2). Icon + text
          convey the state without relying on color (Req 11.7). */}
      {error && (
        <div
          role="alert"
          className="rm-panel"
          style={{
            position: 'absolute', top: '50%', left: 8, right: 8, zIndex: 600,
            transform: 'translateY(-50%)',
            display: 'flex', flexWrap: 'wrap', gap: 10,
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          }}
        >
          <span>⚠️ {error}</span>
          <button type="button" className="rm-btn rm-btn--text" onClick={handleRetry} aria-label="Retry loading the map">
            Retry
          </button>
        </div>
      )}

      {/* Distance + travel-time readout, or an "unavailable" indicator when
          either endpoint is missing (Req 8.2, 8.3, 8.4, 8.7). */}
      {ready && !restaurantUnavailable && (
        <div
          role="status"
          className="rm-panel"
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 500,
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            maxWidth: 'calc(100% - 16px)',
          }}
        >
          {distance ? (
            <>
              <span>📍 {distance.distanceKm.toFixed(1)} km</span>
              <span>🚶 {distance.walkingMinutes} min</span>
              {distance.drivingMinutes !== undefined && <span>🚗 {distance.drivingMinutes} min</span>}
            </>
          ) : (
            <span>Distance unavailable</span>
          )}
        </div>
      )}

      {/* Map controls — real focusable <button>s, keyboard-operable in a
          logical order with accessible names and a visible focus indicator
          (Req 11.4, 11.5, 11.6). */}
      {ready && (
        <div
          style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 500,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
        >
          <button type="button" className="rm-btn" onClick={handleCurrentLocation} aria-label="Center map on my location">
            📍
          </button>
          <button type="button" className="rm-btn" onClick={handleRecenter} aria-label="Fit both the restaurant and my location in view">
            🗺️
          </button>
        </div>
      )}

      {controlError && (
        <div
          role="alert"
          className="rm-panel"
          style={{ position: 'absolute', bottom: 56, left: 8, right: 56, zIndex: 500 }}
        >
          ⚠️ {controlError}
        </div>
      )}

      {/* Stacked status indicators (bottom-left). maxWidth leaves room for the
          control column so nothing overflows at 320px (Req 11.1). Each state
          carries an icon + text, never color alone (Req 11.7). */}
      {ready && (isStale || isApproximate || routeUnavailable) && (
        <div
          style={{
            position: 'absolute', bottom: 8, left: 8, zIndex: 500,
            display: 'flex', flexDirection: 'column', gap: 6,
            maxWidth: 'calc(100% - 72px)',
          }}
        >
          {isStale && (
            <div role="status" className="rm-panel">🕒 Position may be outdated</div>
          )}
          {isApproximate && (
            <div role="status" className="rm-panel">📍 Approximate location</div>
          )}
          {routeUnavailable && resolvedRestaurant && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${resolvedRestaurant.latitude},${resolvedRestaurant.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rm-panel rm-directions-link"
            >
              🧭 Get directions on Google Maps ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
