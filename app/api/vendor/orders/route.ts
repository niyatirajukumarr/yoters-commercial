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
  const IST_OFFSET_MS = (5 * 60 + 30) * 60_000
  let dayStart: Date
  if (dateParam) {
    const parsed = new Date(dateParam + 'T00:00:00Z')
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }
    // dateParam "2026-07-30" represents IST calendar day
    // UTC midnight of that day is 18:30 IST the previous day
    // So subtract IST offset to get IST midnight
    dayStart = new Date(parsed.getTime() - IST_OFFSET_MS)
  } else {
    dayStart = istDayStart()
  }

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  // Auto-mark pending_payment orders as payment_pending if 60+ seconds old
  try {
    const sixtySecondsAgo = new Date(new Date().getTime() - 60000)
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ status: 'payment_pending' })
      .eq('cafeteria_id', cafId)
      .eq('status', 'pending_payment')
      .eq('payment_status', 'unpaid')
      .lt('created_at', sixtySecondsAgo.toISOString())
    if (updateError) {
      logger.error('Failed to auto-mark payment pending:', updateError)
    }
  } catch (err) {
    logger.error('Error in auto-mark payment pending:', err)
  }

  // Orders tab: show ALL active orders regardless of date
  // Today tab: show only orders from the selected date
  let query = adminSupabase
    .from('orders')
    .select('*')
    .eq('cafeteria_id', cafId)

  if (dateParam) {
    // For "today" tab: filter by specific date only (12 AM to 11:59 PM IST)
    query = query
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString())
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    logger.error('Vendor orders query failed:', error)
    return NextResponse.json({ error: 'Failed to load orders.' }, { status: 500 })
  }
  return NextResponse.json({ orders: data })
}
