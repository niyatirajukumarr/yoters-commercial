/**
 * Central TypeScript types and named threshold constants for the Leaflet
 * Maps Integration feature (Req 13.1). Pure declarations only — no runtime
 * logic, no framework imports. Strict mode, zero implicit `any`.
 */

/** A validated geographic coordinate in decimal degrees (WGS84). */
export interface Coordinates {
  /** Latitude in decimal degrees, finite and within -90..90 inclusive (Req 3.1). */
  latitude: number
  /** Longitude in decimal degrees, finite and within -180..180 inclusive (Req 3.1). */
  longitude: number
}

/** A geolocation reading with its reported uncertainty radius and capture time. */
export interface ValidatedPosition extends Coordinates {
  /** Reported accuracy radius in meters; finite and >= 0 (Req 3.1). */
  accuracy: number
  /** Epoch milliseconds at which the reading was captured. */
  timestamp: number
}

/**
 * Result of a distance computation between two coordinates.
 * `drivingMinutes` is present only when the Routing_Provider succeeds.
 */
export interface DistanceResult {
  /** Geodesic (Haversine) distance in kilometers (Req 8.1). */
  distanceKm: number
  /** Estimated walking time in whole minutes at WALKING_SPEED_KMH (Req 8.3). */
  walkingMinutes: number
  /** Estimated driving time in whole minutes; only set when routing succeeds (Req 8.4-8.6). */
  drivingMinutes?: number
}

/**
 * Generic caught-error carrier so callers never face an unhandled rejection
 * or uncaught throw (Req 13.6). Discriminated on `ok`.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

/**
 * A single geocoding result returned by the Routing_Provider client
 * (`lib/utils/geocodingClient.ts`) after validation (Req 3.3, 3.5).
 */
export interface GeocodeHit extends Coordinates {
  /** Human-readable display name for the matched place. */
  displayName: string
}

/**
 * A driving route between two coordinates returned by the Routing_Provider
 * client (`lib/utils/geocodingClient.ts`), Req 10.7.
 */
export interface RoutePath {
  /** Ordered `[latitude, longitude]` points describing the route geometry. */
  points: Array<[number, number]>
  /** Estimated driving time in whole minutes, when reported by the provider. */
  durationMinutes?: number
}

/**
 * Props for the lazy-loaded Map_Component (`components/RestaurantMap.tsx`).
 * All optional so a host can mount the map with zero configuration.
 */
export interface RestaurantMapProps {
  /** Restaurant coordinates; defaults to LETHAFI_COORDINATES when omitted. */
  restaurant?: Coordinates
  /** When true, attempt to draw the Routing_Provider path between markers (Req 10.7). */
  showRoute?: boolean
  /** Optional extra class names applied to the map container. */
  className?: string
}

/**
 * State exposed by the one-shot Location_Service hook
 * (`lib/hooks/useLocationService.ts`), Req 6.
 */
export interface LocationServiceState {
  /** Lifecycle status of the one-shot location request. */
  status: 'idle' | 'requesting' | 'success' | 'denied' | 'timeout' | 'unsupported' | 'error'
  /** Last validated position, or null before a successful read. */
  position: ValidatedPosition | null
  /** True when accuracy radius exceeds APPROXIMATE_THRESHOLD (Req 6.6). */
  isApproximate: boolean
  /** Human-readable error message, or null when no error. */
  error: string | null
  /** Remaining retry attempts; starts at 3 (Req 6.4). */
  retriesRemaining: number
}

/**
 * State exposed by the continuous Geolocation_Tracker hook
 * (`lib/hooks/useGeolocationTracker.ts`), Req 7 & 9.
 */
export interface TrackingState {
  /** Lifecycle status of the position watch. */
  status: 'inactive' | 'tracking' | 'stopped' | 'stale'
  /** Last accepted position, or null before any accepted reading. */
  position: ValidatedPosition | null
  /** True when the last accepted reading exceeds APPROXIMATE_THRESHOLD. */
  isApproximate: boolean
  /** True when no update has been accepted within STALE_MS (Req 7.7, 9.6). */
  isStale: boolean
  /** Human-readable error message, or null when no error. */
  error: string | null
}

/* -------------------------------------------------------------------------- */
/* Named, documented thresholds and tuning constants (Req 9.7).               */
/* -------------------------------------------------------------------------- */

/** Meters — readings with a worse accuracy radius are rejected (Req 9.2). */
export const ACCURACY_THRESHOLD = 100

/** Meters — accepted readings worse than this are flagged approximate (Req 6.6). */
export const APPROXIMATE_THRESHOLD = 50

/** Meters — minimum movement treated as real rather than GPS drift (Req 9.3-9.5). */
export const DRIFT_THRESHOLD = 10

/** Kilometers per hour — fixed walking speed for travel-time estimates (Req 8.3). */
export const WALKING_SPEED_KMH = 5.0

/** Milliseconds — one-shot geolocation request timeout (Req 6.1). */
export const GEO_TIMEOUT_MS = 10000

/** Milliseconds — Routing_Provider request timeout for driving time/route (Req 8.4). */
export const ROUTING_TIMEOUT_MS = 5000

/** Milliseconds — debounce window for tracked position commits (Req 7.4). */
export const TRACK_DEBOUNCE_MS = 3000

/** Milliseconds — no accepted update within this window marks the position stale (Req 7.7, 9.6). */
export const STALE_MS = 30000

/** Maximum entries retained in the geocoding/routing/distance LRU cache (Req 12.6). */
export const CACHE_MAX_ENTRIES = 50

/** Milliseconds — dedup window for reusing cached outbound results (Req 12.4). */
export const DEDUP_WINDOW_MS = 60000

/** Decimal places used to key cache/memoization on coordinates (Req 12.4, 12.5). */
export const COORD_PRECISION_DP = 5
