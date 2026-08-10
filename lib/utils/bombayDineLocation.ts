import type { Coordinates } from '../types/geo'
import { validateCoordinates } from './geoValidation'

/**
 * Bombay Dine restaurant coordinates in decimal degrees (WGS84).
 * Extracted from Google Maps link: https://maps.app.goo.gl/jNzGPD5ELJEMqBxN6
 */
export const BOMBAY_DINE_COORDINATES: Coordinates = {
  latitude: 13.08500585655609,
  longitude: 77.48652925409827,
}

/**
 * Returns the validated Bombay Dine restaurant coordinates for the Map_Component.
 */
export function getBombayDineLocation(): Coordinates | null {
  const result = validateCoordinates(
    BOMBAY_DINE_COORDINATES.latitude,
    BOMBAY_DINE_COORDINATES.longitude
  )
  return result.ok ? result.value : null
}
