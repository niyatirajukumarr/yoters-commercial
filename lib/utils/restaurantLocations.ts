/**
 * Restaurant_Location_Store lookup for the Leaflet Maps Integration feature.
 *
 * `lethafiLocation.ts` holds one restaurant's coordinates as a static config
 * constant. A second restaurant now needs the same map, so this module is the
 * name -> coordinates registry the UI asks instead of hardcoding a name check
 * at each call site. Same rules as before: static, non-secret values resolved
 * once at implementation time, validated at the trust boundary, and never
 * fetched or expanded from a share link at runtime (Req 5.1, 5.2, 5.3, 5.5).
 */

import type { Coordinates } from '../types/geo'
import { validateCoordinates } from './geoValidation'
import { LETHAFI_COORDINATES } from './lethafiLocation'

/**
 * Bombay Dine coordinates in decimal degrees (WGS84).
 *
 * Sourced from the OpenStreetMap node for "Bombay Dine" on Acharya Dr
 * Sarvepalli Radhakrishnan Road, Soladevanahalli (osm node 6807495853). The
 * Google share link supplied for it resolves only to a search result carrying
 * a `kgmid`, which yields coordinates solely through Maps' client-side JS —
 * the same obstacle documented for LETHAFI, minus a browser to settle it in.
 * The OSM node sits ~310m from LETHAFI on the same road, consistent with the
 * stored address, but it is third-party data: worth confirming against the pin
 * in Maps before anyone relies on the distance for a delivery charge.
 */
export const BOMBAY_DINE_COORDINATES: Coordinates = {
  latitude: 13.0834749,
  longitude: 77.4844983,
}

/**
 * Coordinates by restaurant name, matching `cafeterias.name` exactly.
 *
 * A restaurant absent from here simply has no map — the UI hides the prompt
 * rather than pointing at a default someone else's pin.
 */
const LOCATIONS: Record<string, Coordinates> = {
  LETHAFI: LETHAFI_COORDINATES,
  'Bombay Dine': BOMBAY_DINE_COORDINATES,
}

/**
 * Returns validated coordinates for a restaurant, or `null` when it has none
 * on file or the stored pair fails validation.
 *
 * @param name restaurant name as stored in `cafeterias.name`
 */
export function getRestaurantLocation(name: string): Coordinates | null {
  const stored = LOCATIONS[name]
  if (!stored) return null

  const result = validateCoordinates(stored.latitude, stored.longitude)
  return result.ok ? result.value : null
}
