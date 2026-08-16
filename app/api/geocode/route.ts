import { NextRequest, NextResponse } from 'next/server'

/**
 * Forward geocoding: free-text address -> coordinates.
 *
 * The delivery modal lets a customer type an address instead of dropping a
 * pin. Without coordinates the delivery distance cannot be computed, so the
 * order was accepted by the modal and then rejected at checkout with "Please
 * select a delivery location" — pointing at a step the customer had already
 * done. This resolves the typed text at the moment they confirm.
 *
 * Server-side so the request carries the User-Agent Nominatim's usage policy
 * expects, same as the reverse-geocode route next door.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || !q.trim()) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'YotersApp/1.0 (yoters.site)', 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const hit = Array.isArray(data) ? data[0] : null
    if (!hit) return NextResponse.json({ lat: null, lng: null })

    const lat = Number(hit.lat)
    const lng = Number(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ lat: null, lng: null })
    }

    return NextResponse.json({ lat, lng, address: hit.display_name ?? null })
  } catch {
    return NextResponse.json({ lat: null, lng: null })
  }
}
