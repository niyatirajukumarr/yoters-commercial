import type { Coordinates } from '../types/geo'
import { validateCoordinates } from './geoValidation'

// The Punjabi House - Acharya College Road Gate 3 Opposite
const PUNJABI_HOUSE_COORDINATES: Coordinates = {
  latitude: 13.085468952875958,
  longitude: 77.486715781298,
}

export function getPunjabiHouseLocation(): Coordinates | null {
  const result = validateCoordinates(
    PUNJABI_HOUSE_COORDINATES.latitude,
    PUNJABI_HOUSE_COORDINATES.longitude
  )
  return result.ok ? result.value : null
}
