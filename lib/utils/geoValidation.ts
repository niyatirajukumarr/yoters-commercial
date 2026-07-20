/**
 * Trust-boundary coordinate validation for the Leaflet Maps Integration
 * feature (Req 3.1, 3.2). Pure, framework-free helpers shared by the location
 * hooks and the distance/geocoding services. Every fallible validator returns
 * a caught `Result<T>` rather than throwing, so callers never face an
 * unhandled rejection or uncaught exception (Req 13.6).
 *
 * Three inputs cross into the feature and must be validated here before use:
 * browser geolocation readings, the stored Lethafi constant, and any stored or
 * query-parameter coordinates.
 */

import type { Coordinates, ValidatedPosition, Result } from '../types/geo'

/**
 * Returns true when `value` is a finite latitude within -90..90 inclusive.
 * @param value candidate latitude in decimal degrees
 * @returns whether the value is a usable latitude
 */
export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

/**
 * Returns true when `value` is a finite longitude within -180..180 inclusive.
 * @param value candidate longitude in decimal degrees
 * @returns whether the value is a usable longitude
 */
export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

/**
 * Returns true when `value` is a finite, non-negative accuracy radius.
 * @param value candidate accuracy radius in meters
 * @returns whether the value is a usable accuracy radius
 */
export function isValidAccuracy(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

/**
 * Validates a latitude/longitude pair at a trust boundary (Req 3.1, 3.2).
 * @param latitude candidate latitude in decimal degrees
 * @param longitude candidate longitude in decimal degrees
 * @returns `{ ok: true, value }` with the validated coordinates, or
 *   `{ ok: false, error }` describing the first failing field.
 */
export function validateCoordinates(latitude: number, longitude: number): Result<Coordinates> {
  if (!isValidLatitude(latitude)) {
    return { ok: false, error: 'Invalid latitude: expected a finite number within -90..90' }
  }
  if (!isValidLongitude(longitude)) {
    return { ok: false, error: 'Invalid longitude: expected a finite number within -180..180' }
  }
  return { ok: true, value: { latitude, longitude } }
}

/**
 * Validates a raw geolocation reading (latitude, longitude, accuracy) at a
 * trust boundary and, on success, carries the capture timestamp through
 * (Req 3.1, 3.2). Rejects rather than throwing (Req 13.6).
 * @param latitude candidate latitude in decimal degrees
 * @param longitude candidate longitude in decimal degrees
 * @param accuracy reported accuracy radius in meters (finite, >= 0)
 * @param timestamp epoch milliseconds of the reading; defaults to now
 * @returns `{ ok: true, value }` with the validated position, or
 *   `{ ok: false, error }` describing the first failing field.
 */
export function validatePosition(
  latitude: number,
  longitude: number,
  accuracy: number,
  timestamp: number = Date.now()
): Result<ValidatedPosition> {
  const coords = validateCoordinates(latitude, longitude)
  if (!coords.ok) {
    return coords
  }
  if (!isValidAccuracy(accuracy)) {
    return { ok: false, error: 'Invalid accuracy: expected a finite non-negative number' }
  }
  return { ok: true, value: { latitude, longitude, accuracy, timestamp } }
}
