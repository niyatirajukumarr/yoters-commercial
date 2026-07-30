/**
 * Calculate delivery charge based on distance in kilometers.
 *
 * Pricing:
 * - 0.5-1 km: ₹10
 * - 1-2 km: ₹15 (₹10 + ₹5)
 * - 2-3 km: ₹20 (₹10 + ₹5×2)
 * - 3-4 km: ₹25 (₹10 + ₹5×3)
 * - And so on: ₹5 per additional km
 */
export function getDeliveryCharge(distanceKm: number): { charge: number; message?: string } {
  if (distanceKm <= 0) {
    return { charge: 0 }
  }

  // Base ₹10 for first 1km, then ₹5 for each additional km
  const charge = 10 + (Math.ceil(distanceKm) - 1) * 5

  return { charge }
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
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
  distance: number
  charge: number
  message?: string
  isServiceable: boolean
}

/**
 * Calculate delivery charge info for a delivery.
 * Returns distance, charge amount, and whether the location is serviceable.
 */
export function calculateDeliveryChargeInfo(
  cafeteriaLat: number,
  cafeteriaLng: number,
  deliveryLat: number,
  deliveryLng: number
): DeliveryChargeInfo {
  const distance = calculateDistance(cafeteriaLat, cafeteriaLng, deliveryLat, deliveryLng)
  const chargeInfo = getDeliveryCharge(distance)

  return {
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
    charge: chargeInfo.charge,
    message: chargeInfo.message,
    isServiceable: chargeInfo.charge > 0
  }
}
