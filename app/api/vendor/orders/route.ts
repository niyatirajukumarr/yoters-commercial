import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAdminClient, requireVendorForCafeteria, authErrorStatus } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { istDayStart } from '@/lib/day-window'

const adminSupabase = getAdminClient()

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, 'vendor-orders', 60, 60_000)
  if (limited) return limited

  const cafId = req.nextUrl.searchParams.get('cafeteriaId')
  const dateParam = req.nextUrl.searchParams.get('date')
  if (!cafId) return NextResponse.json({ error: 'Missing cafeteriaId' }, { status: 400 })

  // Orders carry customer PII — only the owning vendor (or a manager/admin) may
  // list them. Identity is taken from the verified session token (R7).
  const auth = await requireVendorForCafeteria(req, cafId)
  if ('error' in auth) {
    const status = authErrorStatus(auth.error)
    return NextResponse.json(
      { error: status === 404 ? 'Cafeteria not found' : 'Unauthorized' },
      { status }
    )
  }

  // Fetch orders for a specific date or today if no date provided.
  // Date format: YYYY-MM-DD (e.g., 2026-07-31)
  let dayStart: Date
  if (dateParam) {
    const parsed = new Date(dateParam + 'T00:00:00Z')
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }
    dayStart = new Date(parsed.getTime() + (5.5 * 60 * 60 * 1000))
    dayStart.setUTCHours(0, 0, 0, 0)
    dayStart = new Date(dayStart.getTime() - (5.5 * 60 * 60 * 1000))
  } else {
    dayStart = istDayStart()
  }

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const { data, error } = await adminSupabase
    .from('orders')
    .select('*')
    .eq('cafeteria_id', cafId)
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Vendor orders query failed:', error)
    return NextResponse.json({ error: 'Failed to load orders.' }, { status: 500 })
  }
  return NextResponse.json({ orders: data })
}
