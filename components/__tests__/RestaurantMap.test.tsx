// @vitest-environment jsdom
/**
 * Example / integration tests for the Map_Component (`components/RestaurantMap.tsx`).
 *
 * These are example/integration tests (NOT property tests). They render the
 * real component through `@testing-library/react` (v16, already installed) in a
 * jsdom environment. Two hard constraints shape the setup:
 *
 *  1. Leaflet does not run meaningfully in jsdom (no real layout / canvas), so
 *     `leaflet` is replaced with a `vi.mock` whose `map`/`tileLayer`/`marker`/
 *     `divIcon`/`polyline`/`latLng`/`latLngBounds` return chainable no-op stubs.
 *     This lets the component's async init reach the `ready` state without
 *     throwing, and lets us assert against the mock's call log (e.g. that
 *     attribution was configured, that `setView` was NOT called).
 *  2. Outbound Nominatim/OSRM calls must never hit the network, so
 *     `lib/utils/geocodingClient` is mocked; `drivingMinutes`/`fetchRoute`
 *     resolve to a failed `Result` by default (individual tests override).
 *
 * `navigator.geolocation` is stubbed like `useGeolocationTracker.test.ts`, with
 * the `watchPosition` success callback captured so a test can feed a synthetic
 * user position and drive the distance/travel-time readout.
 *
 * jsdom does not compute real layout or evaluate CSS pseudo-classes. Where a
 * requirement is about rendered geometry (no horizontal scroll) or `:focus-visible`
 * styling, the assertion is adapted to the closest observable proxy — the
 * containment styles / stylesheet rule that guarantee the behavior — and the
 * adaptation is documented inline. No listed requirement is dropped.
 *
 * Covers Req 11.1 (responsive), 11.2 (attribution), 11.4/11.5/11.6 (keyboard /
 * accessible names / focus indicator), 10.9/10.10 (loading/error/retry), 10.6
 * (current-location unavailable), 8.5 (driving time omitted on routing failure).
 * jest-dom is NOT installed, so only plain DOM assertions are used.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'

// --- Leaflet mock (hoisted so vi.mock's factory can see it) ----------------
// A single shared map instance with vi.fn methods lets tests assert on calls
// like setView. Layer/marker factories return chainable stubs (addTo/remove).
const leaflet = vi.hoisted(() => {
  const mapInstance = {
    setView: vi.fn(function (this: unknown) { return this }),
    fitBounds: vi.fn(function (this: unknown) { return this }),
    panTo: vi.fn(function (this: unknown) { return this }),
    remove: vi.fn(),
    off: vi.fn(),
    getZoom: vi.fn(() => 13),
  }
  const makeLayer = () => ({
    addTo: vi.fn(function (this: unknown) { return this }),
    remove: vi.fn(),
  })
  const makeMarker = () => ({
    addTo: vi.fn(function (this: unknown) { return this }),
    setLatLng: vi.fn(function (this: unknown) { return this }),
    getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
    remove: vi.fn(),
  })
  const L = {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => makeLayer()),
    marker: vi.fn(() => makeMarker()),
    divIcon: vi.fn(() => ({})),
    polyline: vi.fn(() => makeLayer()),
    latLng: vi.fn(() => ({ toBounds: vi.fn(() => ({})) })),
    latLngBounds: vi.fn(() => ({})),
  }
  return { L, mapInstance }
})

vi.mock('leaflet', () => ({ default: leaflet.L }))
// The component also side-effect-imports Leaflet's stylesheet; stub it so the
// jsdom/Vitest resolver never has to process real CSS.
vi.mock('leaflet/dist/leaflet.css', () => ({}))

// --- geocodingClient mock: no live network (Req: "MOCK outbound calls") -----
// Hoisted so the vi.mock factory (also hoisted) can reference these without a
// temporal-dead-zone error.
const geo = vi.hoisted(() => ({
  drivingMinutes: vi.fn(async () => ({ ok: false as const, error: 'unavailable' })),
  fetchRoute: vi.fn(async () => ({ ok: false as const, error: 'unavailable' })),
}))
const { drivingMinutes } = geo
vi.mock('../../lib/utils/geocodingClient', () => ({
  drivingMinutes: geo.drivingMinutes,
  fetchRoute: geo.fetchRoute,
}))

import RestaurantMap from '../RestaurantMap'

// --- navigator.geolocation stub --------------------------------------------
let watchSuccess: PositionCallback | null = null
let watchPosition: ReturnType<typeof vi.fn>
let getCurrentPosition: ReturnType<typeof vi.fn>
let clearWatch: ReturnType<typeof vi.fn>

function installGeolocationMock(): void {
  watchSuccess = null
  watchPosition = vi.fn((s: PositionCallback): number => {
    watchSuccess = s
    return 1
  })
  getCurrentPosition = vi.fn()
  clearWatch = vi.fn()
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: { watchPosition, getCurrentPosition, clearWatch },
    configurable: true,
    writable: true,
  })
}

/** Feeds a synthetic user position through the captured watchPosition callback. */
function emitPosition(latitude: number, longitude: number, accuracy: number): void {
  if (!watchSuccess) throw new Error('watchPosition success callback not registered')
  const reading = {
    coords: { latitude, longitude, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
  } as unknown as GeolocationPosition
  act(() => {
    watchSuccess!(reading)
  })
}

/** Renders the map and waits until async Leaflet init reaches the ready state. */
async function renderReadyMap(props: Parameters<typeof RestaurantMap>[0] = {}) {
  const utils = render(<RestaurantMap {...props} />)
  // A control button only renders once `ready` is true.
  await screen.findByLabelText('Center map on my location')
  return utils
}

function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  installGeolocationMock()
})

afterEach(() => {
  cleanup()
})

describe('RestaurantMap responsiveness (Req 11.1)', () => {
  // jsdom performs no layout, so scrollWidth/clientWidth are always 0 and a real
  // "no horizontal scroll" measurement is impossible. We instead assert the
  // containment styles that structurally guarantee no horizontal overflow at any
  // width: the root and its inner map container are width:100%, maxWidth:100%,
  // and the root clips overflow. We render at both viewport extremes to confirm
  // the containment is width-independent.
  for (const width of [320, 1920]) {
    it(`keeps content within the viewport at ${width}px`, async () => {
      setViewportWidth(width)
      const { container } = await renderReadyMap()

      const root = container.firstElementChild as HTMLElement
      expect(root).toBeTruthy()
      expect(root.style.width).toBe('100%')
      expect(root.style.maxWidth).toBe('100%')
      expect(root.style.overflow).toBe('hidden')

      // The Leaflet map container is the root's first child div and is also
      // width-constrained so tiles/controls cannot push past the viewport edge.
      const mapContainer = root.querySelector('div') as HTMLElement
      expect(mapContainer.style.width).toBe('100%')
      expect(mapContainer.style.maxWidth).toBe('100%')
    })
  }
})

describe('RestaurantMap OSM attribution (Req 11.2)', () => {
  it('enables the always-visible attribution control and supplies OSM attribution text', async () => {
    await renderReadyMap()

    // Attribution visibility is a Leaflet-DOM concern that the mock elides, so
    // we assert against the configuration the component passed to Leaflet:
    // (a) the map was created with attributionControl enabled, and
    // (b) the tile layer carries OpenStreetMap attribution text.
    expect(leaflet.L.map).toHaveBeenCalled()
    // The mock's declared signature has no params, so `.mock.calls[0]` is typed
    // as an empty tuple; widen to `unknown[]` before reading the options arg.
    const mapOptions = (leaflet.L.map.mock.calls[0] as unknown[])[1] as { attributionControl?: boolean }
    expect(mapOptions.attributionControl).toBe(true)

    expect(leaflet.L.tileLayer).toHaveBeenCalled()
    const tileOptions = (leaflet.L.tileLayer.mock.calls[0] as unknown[])[1] as { attribution?: string }
    expect(tileOptions.attribution).toBeTruthy()
    expect(tileOptions.attribution).toContain('OpenStreetMap')
  })
})

describe('RestaurantMap keyboard & accessibility (Req 11.4, 11.5, 11.6)', () => {
  it('exposes accessible names for every control and makes them keyboard-focusable', async () => {
    await renderReadyMap()

    // Req 11.5: programmatically determinable accessible name (aria-label) for
    // each interactive control.
    const currentLocation = screen.getByLabelText('Center map on my location')
    const recenter = screen.getByLabelText('Fit both the restaurant and my location in view')

    for (const btn of [currentLocation, recenter]) {
      // Req 11.4: real, enabled <button>s are in the natural tab order.
      expect(btn.tagName).toBe('BUTTON')
      expect((btn as HTMLButtonElement).disabled).toBe(false)
      expect((btn as HTMLElement).tabIndex).toBeGreaterThanOrEqual(0)
      // Reachable via keyboard focus.
      ;(btn as HTMLElement).focus()
      expect(document.activeElement).toBe(btn)
    }
  })

  it('defines a visible focus indicator via a :focus-visible rule (Req 11.6)', async () => {
    const { container } = await renderReadyMap()

    // jsdom cannot evaluate :focus-visible or compute the resulting outline, so
    // we assert the component ships the focus-indicator rule in its stylesheet:
    // a `.rm-btn:focus-visible` selector that draws a solid outline.
    const styleText = Array.from(container.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n')
    expect(styleText).toContain('.rm-btn:focus-visible')
    expect(styleText).toMatch(/outline:\s*3px solid/)
  })
})

describe('RestaurantMap loading / error / retry states (Req 10.9, 10.10)', () => {
  it('shows a loading state before the map becomes ready (Req 10.9)', async () => {
    render(<RestaurantMap />)
    // Async Leaflet init has not resolved yet on first paint: loading is shown.
    expect(screen.getByText('Loading map…')).toBeTruthy()
    expect(screen.getByRole('status')).toBeTruthy()

    // Once init resolves the loading state clears and controls appear.
    await screen.findByLabelText('Center map on my location')
    expect(screen.queryByText('Loading map…')).toBeNull()
  })

  it('shows an error+retry state on init failure and recovers when Retry is pressed (Req 10.10)', async () => {
    // Force the first map init to throw; the component must catch it and surface
    // the error+retry state rather than crashing.
    leaflet.L.map.mockImplementationOnce(() => {
      throw new Error('init boom')
    })

    render(<RestaurantMap />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('The map failed to load')

    const retry = screen.getByLabelText('Retry loading the map')
    expect(retry.tagName).toBe('BUTTON')

    // Retry re-attempts init + data retrieval; the second map() call succeeds.
    fireEvent.click(retry)

    await screen.findByLabelText('Center map on my location')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('The map failed to load')).toBeNull()
  })
})

describe('RestaurantMap current-location unavailable (Req 10.6)', () => {
  it('indicates the location is unavailable and leaves the map view unchanged', async () => {
    // No position is ever emitted, so userPosition stays null.
    await renderReadyMap()

    // Sanity: init framed the restaurant via fitBounds, never setView.
    expect(leaflet.mapInstance.setView).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('Center map on my location'))

    // Req 10.6: error indication shown...
    const alert = await screen.findByText('⚠️ Your location is unavailable')
    expect(alert).toBeTruthy()
    // ...and the map view is left unchanged (no recenter happened).
    expect(leaflet.mapInstance.setView).not.toHaveBeenCalled()
  })
})

describe('RestaurantMap driving time omitted on routing failure (Req 8.5)', () => {
  it('renders distance and walking time but omits driving time when routing fails', async () => {
    // Default drivingMinutes mock already resolves { ok: false }.
    await renderReadyMap()

    // Feed a user position so distance/walking-time compute (restaurant defaults
    // to the validated Lethafi coordinates). Accuracy 20m is accepted.
    emitPosition(13.09, 77.5, 20)

    // Distance panel shows km + walking time.
    const walking = await screen.findByText(/🚶/)
    expect(walking).toBeTruthy()
    expect(screen.getByText(/📍 \d/)).toBeTruthy()

    // Give the async drivingMinutes call a chance to (fail to) resolve, then
    // assert the driving-time entry is absent (Req 8.5).
    await act(async () => {
      await Promise.resolve()
    })
    expect(drivingMinutes).toHaveBeenCalled()
    expect(screen.queryByText(/🚗/)).toBeNull()
  })
})
