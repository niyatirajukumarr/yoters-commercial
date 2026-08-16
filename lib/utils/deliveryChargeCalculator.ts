/**
 * Straight-line distance between two points never matches what a rider
 * actually covers: roads bend, one-ways double back, and a 4.9 km line can be
 * 7 km of riding. Charging on the line under-prices every delivery and makes
 * the 5 km limit softer than it reads.
 *
 * This factor is the usual urban detour ratio — the correction applied when
 * road distance is not being looked up. It is deliberately one named constant:
 * if real routing is wired in later, this is the thing it replaces.
 */
export const ROAD_DISTANCE_FACTOR = 1.3

/** Furthest a rider will go, measured on the corrected distance. */
export const MAX_DELIVERY_KM = 5

/**
 * Calculate delivery charge for a distance already corrected and rounded by
 * {@link calculateDeliveryChargeInfo}.
 *
 * Pricing tiers:
 * - up to 1.0 km: ₹10
 * - up to 1.5 km: ₹15
 * - up to 2.0 km: ₹20
 * - up to 2.5 km: ₹25
 * - up to 3.0 km: ₹30
 * - up to 3.5 km: ₹35
 * - up to 4.0 km: ₹40
 * - up to 4.5 km: ₹50
 * - up to 5.0 km: ₹55
 * - beyond 5 km: no delivery
 */
export function getDeliveryCharge(distanceKm: number): { charge: number; message?: string } {
  if (distanceKm <= 0) {
    return { charge: 0 }
  }

  if (distanceKm > MAX_DELIVERY_KM) {
    return { charge: 0, message: `Delivery not available beyond ${MAX_DELIVERY_KM} km` }
  }

  if (distanceKm <= 1.0) return { charge: 10 }
  if (distanceKm <= 1.5) return { charge: 15 }
  if (distanceKm <= 2.0) return { charge: 20 }
  if (distanceKm <= 2.5) return { charge: 25 }
  if (distanceKm <= 3.0) return { charge: 30 }
  if (distanceKm <= 3.5) return { charge: 35 }
  if (distanceKm <= 4.0) return { charge: 40 }
  if (distanceKm <= 4.5) return { charge: 50 }
  return { charge: 55 }
}

/**
 * Great-circle distance between two coordinates, in kilometres.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometres
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export interface DeliveryChargeInfo {
  /** Road-corrected distance, rounded to 1 dp — the number the customer sees. */
  distance: number
  charge: number
  message?: string
}

/**
 * Distance and charge for one delivery.
 *
 * The charge is derived from the same rounded number that gets displayed.
 * Tiering the raw value instead meant a customer at 1.04 km was shown
 * "1 km" and billed the 1.5 km rate, and one at 5.04 km was shown "5 km" and
 * refused — the screen and the price disagreeing about the same journey.
 */
export function calculateDeliveryChargeInfo(
  cafeteriaLat: number,
  cafeteriaLng: number,
  deliveryLat: number,
  deliveryLng: number
): DeliveryChargeInfo {
  const straightLine = calculateDistance(cafeteriaLat, cafeteriaLng, deliveryLat, deliveryLng)
  const distance = Math.round(straightLine * ROAD_DISTANCE_FACTOR * 10) / 10
  const chargeInfo = getDeliveryCharge(distance)

  return {
    distance,
    charge: chargeInfo.charge,
    message: chargeInfo.message,
  }
}
