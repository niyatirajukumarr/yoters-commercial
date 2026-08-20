/**
 * Recomputes what an order should cost, from the menu rather than from
 * whatever the browser wrote into the row.
 *
 * The orders table accepts an INSERT straight from the client with no
 * validation on `total_amount`, and the payment routes have been trusting the
 * stored value. A tampered client could zero its delivery charge, or its whole
 * total, and pay that. This is the server's own opinion of the price, for the
 * payment route to check the stored one against.
 */

import { calculateDeliveryChargeInfo } from './deliveryChargeCalculator'
import { calculateParcelCharge } from './parcelCharge'
import { getRestaurantConfig } from './restaurantConfig'

export interface PricedMenuItem {
  id: string
  price: number | null
  category: string | null
  variants?: Array<{ name: string; price: number }> | null
}

export interface OrderLine {
  menuId?: string
  name?: string
  price?: number
  quantity?: number
  /** Size picked on the menu card, e.g. "Half" / "Full". */
  variant?: string
}

export interface ExpectedTotalInput {
  items: OrderLine[]
  menuById: Map<string, PricedMenuItem>
  orderType: string | null | undefined
  cafeteria: { latitude: number | null; longitude: number | null }
  delivery: { latitude: number | null; longitude: number | null }
  restaurantName?: string | null
}

export interface ExpectedTotal {
  subtotal: number
  parcelCharge: number
  deliveryCharge: number
  total: number
  /**
   * True when every line was priced from the menu. False when at least one
   * could not be — an item since removed, or a cart from before menu ids were
   * stored — in which case `subtotal` and `total` are not trustworthy, though
   * the two charges still are.
   */
  itemsPriced: boolean
  /** Message if minimum order amount not met */
  minOrderMessage?: string
}

/**
 * Menu price for one cart line: the variant's price when a size was picked,
 * the item's own price otherwise. Returns null when the line cannot be priced,
 * rather than guessing.
 */
export function unitPriceFor(line: OrderLine, menu: PricedMenuItem | undefined): number | null {
  if (!menu) return null

  if (line.variant) {
    const variant = menu.variants?.find(v => v.name === line.variant)
    const price = variant ? Number(variant.price) : NaN
    return Number.isFinite(price) ? price : null
  }

  const price = Number(menu.price)
  return Number.isFinite(price) ? price : null
}

export function expectedOrderTotal(input: ExpectedTotalInput): ExpectedTotal {
  const { items, menuById, orderType, cafeteria, delivery, restaurantName } = input

  let subtotal = 0
  let itemsPriced = items.length > 0

  for (const line of items) {
    const unit = unitPriceFor(line, line.menuId ? menuById.get(line.menuId) : undefined)
    if (unit === null) {
      itemsPriced = false
      continue
    }
    subtotal += unit * (Number(line.quantity) || 0)
  }

  // Check minimum order amount for this restaurant
  const config = restaurantName ? getRestaurantConfig(restaurantName) : {}
  let minOrderMessage: string | undefined
  if (config.minOrderAmount && subtotal > 0 && subtotal < config.minOrderAmount) {
    minOrderMessage = `Minimum order amount is ₹${config.minOrderAmount}`
  }

  const categoryByMenuId = new Map<string, string | null>()
  menuById.forEach((menu, id) => categoryByMenuId.set(id, menu.category))
  const parcelCharge = calculateParcelCharge(items, categoryByMenuId, orderType, restaurantName)

  let deliveryCharge = 0
  if (
    orderType === 'delivery' &&
    cafeteria.latitude != null && cafeteria.longitude != null &&
    delivery.latitude != null && delivery.longitude != null
  ) {
    deliveryCharge = calculateDeliveryChargeInfo(
      cafeteria.latitude,
      cafeteria.longitude,
      delivery.latitude,
      delivery.longitude,
      restaurantName
    ).charge
  }

  return {
    subtotal,
    parcelCharge,
    deliveryCharge,
    total: subtotal + parcelCharge + deliveryCharge,
    itemsPriced,
    minOrderMessage,
  }
}
