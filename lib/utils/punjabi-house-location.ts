import { Coordinates } from '../types'

// The Punjabi House - Acharya College Road Gate 3 Opposite
// Approximate coordinates based on Acharya College location
const PUNJABI_HOUSE_COORDINATES: Coordinates = {
  latitude: 13.064587,
  longitude: 77.486421,
}

function validateCoordinates(coords: Coordinates): boolean {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  )
}

export function getPunjabiHouseLocation(): Coordinates | null {
  if (validateCoordinates(PUNJABI_HOUSE_COORDINATES)) {
    return PUNJABI_HOUSE_COORDINATES
  }
  return null
}
