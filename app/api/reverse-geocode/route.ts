import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'YotersApp/1.0 (yoters-commercial.vercel.app)' } }
    )
    const data = await res.json()
    if (data?.display_name) {
      return NextResponse.json({ address: data.display_name })
    }
    return NextResponse.json({ address: null })
  } catch {
    return NextResponse.json({ address: null })
  }
}
