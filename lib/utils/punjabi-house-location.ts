import type { Coordinates } from '../types/geo'
import { validateCoordinates } from './geoValidation'

// The Punjabi House - Acharya College Road Gate 3 Opposite
// Approximate coordinates based on Acharya College location
const PUNJABI_HOUSE_COORDINATES: Coordinates = {
  latitude: 13.064587,
  longitude: 77.486421,
}

export function getPunjabiHouseLocation(): Coordinates | null {
  const result = validateCoordinates(
    PUNJABI_HOUSE_COORDINATES.latitude,
    PUNJABI_HOUSE_COORDINATES.longitude
  )
  return result.ok ? result.value : null
}
