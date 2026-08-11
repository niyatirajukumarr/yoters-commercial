import { describe, it, expect } from 'vitest'
import { expectedOrderTotal, unitPriceFor, type PricedMenuItem } from '../orderTotal'
import { calculateDeliveryChargeInfo, getDeliveryCharge, ROAD_DISTANCE_FACTOR } from '../deliveryChargeCalculator'
import { calculateParcelCharge } from '../parcelCharge'

const LETHAFI = { latitude: 13.0841374, longitude: 77.4872613 }

const menu = (over: Partial<PricedMenuItem> & { id: string }): PricedMenuItem => ({
  price: 80,
  category: 'Thick Shake',
  variants: null,
  ...over,
})

const menuMap = (...rows: PricedMenuItem[]) => new Map(rows.map(r => [r.id, r]))

describe('unitPriceFor', () => {
  it('takes the variant price when a size was picked', () => {
    const row = menu({ id: 'a', price: 200, variants: [{ name: 'Half', price: 120 }, { name: 'Full', price: 200 }] })
    expect(unitPriceFor({ menuId: 'a', variant: 'Half' }, row)).toBe(120)
    expect(unitPriceFor({ menuId: 'a', variant: 'Full' }, row)).toBe(200)
  })

  it('refuses to guess when the variant is gone', () => {
    const row = menu({ id: 'a', price: 200, variants: [{ name: 'Full', price: 200 }] })
    expect(unitPriceFor({ menuId: 'a', variant: 'Half' }, row)).toBeNull()
    expect(unitPriceFor({ menuId: 'a' }, undefined)).toBeNull()
  })
})

describe('delivery charge', () => {
  it('prices from the same rounded distance it displays', () => {
    // The bug this replaces: raw 1.04 km displayed as "1 km" but billed at the
    // 1.5 km tier. Whatever distance is shown must map to the charge shown.
    for (const km of [0.4, 0.95, 1.04, 2.6, 3.999, 4.9]) {
      const info = calculateDeliveryChargeInfo(0, 0, 0, km / 111.32 / ROAD_DISTANCE_FACTOR)
      expect(info.charge).toBe(getDeliveryCharge(info.distance).charge)
    }
  })

  it('corrects a straight line towards road distance', () => {
    // ~1 km apart in a straight line, north-south.
    const info = calculateDeliveryChargeInfo(13.0, 77.0, 13.009, 77.0)
    expect(info.distance).toBeGreaterThan(1.2)
    expect(info.distance).toBeLessThan(1.4)
  })

  it('refuses beyond the limit and says so', () => {
    const far = getDeliveryCharge(5.1)
    expect(far.charge).toBe(0)
    expect(far.message).toMatch(/5 km/)
  })
})

describe('parcel charge', () => {
  const categories = new Map<string, string | null>([
    ['shake', 'Thick Shake'],
    ['burger', 'Burgers'],
  ])

  it('counts every unit, not every line', () => {
    expect(calculateParcelCharge([{ menuId: 'shake', quantity: 2, price: 80 }], categories, 'takeaway')).toBe(10)
    expect(
      calculateParcelCharge(
        [{ menuId: 'shake', quantity: 1, price: 80 }, { menuId: 'shake', quantity: 2, price: 80 }],
        categories,
        'takeaway'
      )
    ).toBe(15)
  })

  it('matches categories despite case and plural drift', () => {
    // 'Thick Shake' in the DB vs 'Thick shake' in the list — this exact
    // mismatch shipped 22 items without a parcel charge.
    expect(calculateParcelCharge([{ menuId: 'shake', quantity: 1, price: 80 }], categories, 'delivery')).toBe(5)
  })

  it('charges nothing for dine-in, uncovered categories, or ₹1 test orders', () => {
    expect(calculateParcelCharge([{ menuId: 'shake', quantity: 3, price: 80 }], categories, 'dine_in')).toBe(0)
    expect(calculateParcelCharge([{ menuId: 'burger', quantity: 3, price: 60 }], categories, 'takeaway')).toBe(0)
    expect(calculateParcelCharge([{ menuId: 'shake', quantity: 3, price: 1 }], categories, 'takeaway')).toBe(0)
  })
})

describe('expectedOrderTotal', () => {
  const items = [{ menuId: 'a', quantity: 2, price: 80 }]
  const menuById = menuMap(menu({ id: 'a' }))

  it('adds subtotal, parcel and delivery', () => {
    const result = expectedOrderTotal({
      items,
      menuById,
      orderType: 'delivery',
      cafeteria: LETHAFI,
      delivery: { latitude: 13.0871374, longitude: 77.4872613 }, // ~330m away
    })
    expect(result.subtotal).toBe(160)
    expect(result.parcelCharge).toBe(10)
    expect(result.deliveryCharge).toBe(10)
    expect(result.total).toBe(180)
    expect(result.itemsPriced).toBe(true)
  })

  it('ignores the price the client claimed for a line', () => {
    // The whole point: a browser writing price: 1 must not lower the total.
    const forged = [{ menuId: 'a', quantity: 2, price: 1 }]
    const result = expectedOrderTotal({
      items: forged,
      menuById,
      orderType: 'takeaway',
      cafeteria: LETHAFI,
      delivery: { latitude: null, longitude: null },
    })
    expect(result.subtotal).toBe(160)
  })

  it('flags an unpriceable line instead of silently undercounting', () => {
    const result = expectedOrderTotal({
      items: [...items, { menuId: 'deleted-item', quantity: 1, price: 50 }],
      menuById,
      orderType: 'takeaway',
      cafeteria: LETHAFI,
      delivery: { latitude: null, longitude: null },
    })
    expect(result.itemsPriced).toBe(false)
  })

  it('charges no delivery when the restaurant has no coordinates', () => {
    const result = expectedOrderTotal({
      items,
      menuById,
      orderType: 'delivery',
      cafeteria: { latitude: null, longitude: null },
      delivery: { latitude: 13.087, longitude: 77.487 },
    })
    expect(result.deliveryCharge).toBe(0)
  })
})
