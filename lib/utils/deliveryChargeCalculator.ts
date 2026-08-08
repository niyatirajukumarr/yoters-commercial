/**
 * Calculate delivery charge based on distance in kilometers.
 *
 * Pricing tiers:
 * - 0.5-1.0 km: ₹10
 * - 1.1-1.5 km: ₹15
 * - 1.6-2.0 km: ₹20
 * - 2.1-2.5 km: ₹25
 * - 2.6-3.0 km: ₹30
 * - 3.1-3.5 km: ₹35
 * - 3.6-4.0 km: ₹40
 * - 4.1-4.5 km: ₹50
 * - 4.6-5.0 km: ₹55
 * - Beyond 5 km: No delivery
 */
export function getDeliveryCharge(distanceKm: number): { charge: number; message?: string } {
  if (distanceKm <= 0) {
    return { charge: 0 }
  }

  // No delivery beyond 5km
  if (distanceKm > 5) {
    return { charge: 0, message: 'Delivery not available beyond 5 km' }
  }

  // Determine charge based on distance tier
  if (distanceKm <= 1.0) return { charge: 10 }
  if (distanceKm <= 1.5) return { charge: 15 }
  if (distanceKm <= 2.0) return { charge: 20 }
  if (distanceKm <= 2.5) return { charge: 25 }
  if (distanceKm <= 3.0) return { charge: 30 }
  if (distanceKm <= 3.5) return { charge: 35 }
  if (distanceKm <= 4.0) return { charge: 40 }
  if (distanceKm <= 4.5) return { charge: 50 }
  if (distanceKm <= 5.0) return { charge: 55 }

  return { charge: 0, message: 'Delivery not available beyond 5 km' }
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
