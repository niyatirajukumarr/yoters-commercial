import { describe, it, expect, vi, afterEach } from 'vitest'

// lib/routes.ts reads NEXT_PUBLIC_BUILD_TARGET once at module load, which is
// what bakes the choice into each build. Testing both targets therefore means
// resetting the module registry between them rather than reassigning a value.
async function loadRoutes(target: 'web' | 'app') {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_BUILD_TARGET', target)
  return import('../routes')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('route helpers', () => {
  it('uses dynamic segments on the web target', async () => {
    const { orderHref, trackHref, deliveryHref, IS_APP_BUILD } = await loadRoutes('web')
    expect(IS_APP_BUILD).toBe(false)
    expect(orderHref('the-punjabi-house')).toBe('/mobile/order/the-punjabi-house')
    expect(trackHref('ord_123')).toBe('/mobile/track/ord_123')
    expect(deliveryHref('ord_123')).toBe('/delivery/ord_123')
  })

  it('uses query strings on the app target', async () => {
    const { orderHref, trackHref, deliveryHref, IS_APP_BUILD } = await loadRoutes('app')
    expect(IS_APP_BUILD).toBe(true)
    // A static export has no server to resolve a path segment, so these must
    // land on the exported /mobile/order/ and /mobile/track/ pages instead.
    expect(orderHref('the-punjabi-house')).toBe('/mobile/order?cafe=the-punjabi-house')
    expect(trackHref('ord_123')).toBe('/mobile/track?order=ord_123')
    expect(deliveryHref('ord_123')).toBe('/delivery?order=ord_123')
  })

  it('escapes ids so a slug cannot inject extra query parameters', async () => {
    const { trackHref, orderHref } = await loadRoutes('app')
    expect(trackHref('a&admin=1')).toBe('/mobile/track?order=a%26admin%3D1')
    expect(orderHref('a b/c?d')).toBe('/mobile/order?cafe=a%20b%2Fc%3Fd')
  })

  it('produces an app path that the exported bundle actually contains', async () => {
    const { trackHref, orderHref, deliveryHref } = await loadRoutes('app')
    // scripts/build-app.mjs prunes the [orderId] / [cafeteriaId] directories,
    // so any href still carrying a segment would 404 on the device.
    for (const href of [trackHref('x'), orderHref('y'), deliveryHref('z')]) {
      const path = href.split('?')[0]
      expect(path.split('/').filter(Boolean).length).toBeLessThanOrEqual(2)
      expect(href).toContain('?')
    }
  })
})
