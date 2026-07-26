import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'YotersApp/1.0 (yoters-commercial.vercel.app)' } }
    )
    const data = await res.json()
    if (!data?.address) return NextResponse.json({ address: null })

    const a = data.address

    // POI/landmark name — cafe, restaurant, shop, amenity, building, etc.
    const poi =
      a.cafe || a.restaurant || a.fast_food || a.food_court ||
      a.shop || a.supermarket || a.mall || a.hotel ||
      a.amenity || a.building || a.office || a.leisure ||
      data.namedetails?.name || data.name || null

    // Street-level detail
    const road = a.road || a.pedestrian || a.footway || null
    const area = a.suburb || a.neighbourhood || a.quarter || null
    const city = a.city || a.town || a.village || a.county || null
    const state = a.state || null

    const parts = [poi, road, area, city, state].filter(Boolean)
    const address = parts.length > 0 ? parts.join(', ') : data.display_name

    return NextResponse.json({ address })
  } catch {
    return NextResponse.json({ address: null })
  }
}
