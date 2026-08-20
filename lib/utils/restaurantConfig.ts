/**
 * Restaurant-specific configuration for pricing rules and limits.
 * Each restaurant can have custom delivery charges, parcel charges, and order limits.
 */

export interface RestaurantConfig {
  /** Parcel charge per item in rupees (null = use default) */
  parcelChargePerItem?: number | null
  /** Apply parcel charge to all orders (true = all, false = only certain categories) */
  parcelChargeApplyToAll?: boolean
  /** Delivery charge in rupees (null = use calculated distance-based charge) */
  deliveryCharge?: number | null
  /** Maximum delivery range in kilometers (null = use default 5km) */
  maxDeliveryKm?: number | null
  /** Maximum order value in rupees (null = no limit) */
  maxOrderAmount?: number | null
}

export const RESTAURANT_CONFIGS: Record<string, RestaurantConfig> = {
  'The Punjabi House': {
    parcelChargePerItem: 10,
    parcelChargeApplyToAll: true,
    deliveryCharge: 0,
    maxDeliveryKm: 2.5,
    maxOrderAmount: 100,
  },
}

export function getRestaurantConfig(restaurantName: string): RestaurantConfig {
  return RESTAURANT_CONFIGS[restaurantName] || {}
}
