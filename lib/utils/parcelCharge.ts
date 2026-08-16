/**
 * Parcel charge rules, shared by the order page and the server-side total
 * check. They used to live inline in the order page, which meant the server
 * had no way to tell what a parcel charge should have been.
 */

export const PARCEL_CHARGE_PER_ITEM = 5

/** Categories whose items leave the counter in a container. */
export const PARCEL_CHARGE_CATEGORIES = [
  'Fresh juices', 'Mojitos', 'Hot beverages', 'Fruit milkshake', 'Thick shake',
  'Coffee shake', "Soda's", 'Special shakes', 'Lassi', 'Ice cream shakes',
  'Delights', 'Quick bites', 'Maggie', 'Loaded fries', 'Strips', 'Combo', 'Big deals',
]

/**
 * Categories are typed by vendors in the dashboard, so an exact match is far
 * too strict: this list said 'Thick shake' while the menu said 'Thick Shake',
 * and one capital letter meant 22 items shipped without a parcel charge. Folds
 * case, apostrophes (Soda's / Sodas) and a trailing plural (Combo / Combos).
 */
export function normalizeCategory(c: string): string {
  return c.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, ' ').trim().replace(/s$/, '')
}

const PARCEL_KEYS = new Set(PARCEL_CHARGE_CATEGORIES.map(normalizeCategory))

export function isParcelCategory(category: string | null | undefined): boolean {
  return !!category && PARCEL_KEYS.has(normalizeCategory(category))
}

export interface ParcelLine {
  menuId?: string
  quantity?: number
  price?: number
}

/**
 * ₹5 per container, counting quantity rather than cart lines — two shakes is
 * two cups. Dine-in pays nothing, and ₹1 test orders are exempt.
 *
 * @param categoryByMenuId category for each menu id, from `cafeteria_menu`
 */
export function calculateParcelCharge(
  items: ParcelLine[],
  categoryByMenuId: Map<string, string | null>,
  orderType: string | null | undefined
): number {
  if (orderType === 'dine_in') return 0
  if (!items.length) return 0
  if (items.every(i => Number(i.price) === 1)) return 0

  const units = items.reduce((n, i) => {
    const category = i.menuId ? categoryByMenuId.get(i.menuId) : null
    return isParcelCategory(category) ? n + (Number(i.quantity) || 0) : n
  }, 0)

  return units * PARCEL_CHARGE_PER_ITEM
}
