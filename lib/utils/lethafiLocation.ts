/**
 * Restaurant_Location_Store for the Leaflet Maps Integration feature (Req 5).
 *
 * Holds the Lethafi restaurant coordinates as a documented, static config
 * constant — not a DB column or environment variable — because the value is
 * static, non-secret, and derived once at implementation time (Req 5.1, 5.3).
 * Pure, framework-free; the value is validated at module load through the
 * shared trust-boundary validator (Req 5.5).
 */

import type { Coordinates } from '../types/geo'
import { validateCoordinates } from './geoValidation'

/**
 * Lethafi restaurant coordinates in decimal degrees (WGS84).
 *
 * Extracted ONCE at implementation time from the Google Maps short link
 * `https://maps.app.goo.gl/C4owi6St2yNtXTgn9`. The link was resolved via an
 * HTTP redirect (`curl -sIL`) to the canonical URL of the form
 * `.../@<lat>,<lng>,<zoom>z` (confirmed by the matching `!3d<lat>!4d<lng>`
 * pair in the resolved URL), yielding lat `13.084268`, lng `77.487346`.
 *
 * The app MUST NOT resolve, fetch, or expand the shortened URL at runtime
 * (Req 5.2); this constant is the persisted source of truth.
 */
export const LETHAFI_COORDINATES: Coordinates = {
  latitude: 13.084268,
  longitude: 77.487346,
}

/**
 * Returns the validated Lethafi restaurant coordinates for the Map_Component.
 *
 * Runs {@link LETHAFI_COORDINATES} through the shared coordinate validator so
 * a malformed or out-of-range constant surfaces as a missing location rather
 * than an invalid marker (Req 5.5).
 *
 * @returns the validated {@link Coordinates}, or `null` when the stored value
 *   fails validation.
 */
export function getLethafiLocation(): Coordinates | null {
  const result = validateCoordinates(
    LETHAFI_COORDINATES.latitude,
    LETHAFI_COORDINATES.longitude
  )
  return result.ok ? result.value : null
}
