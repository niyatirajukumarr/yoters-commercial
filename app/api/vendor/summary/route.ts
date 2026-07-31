import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAdminClient, requireVendorForCafeteria, authErrorStatus } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { istDayStart } from '@/lib/day-window'
import { toPaise, fromPaise } from '@/lib/money'

const adminSupabase = getAdminClient()

type SummaryRow = {
  status: string | null
  payment_status: string | null
  total_amount: number | string | null
  created_at: string
}

export type RangeSummary = {
  orders: number
  completed: number
  active: number
  cancelled: number
  /** Value of collected orders — what the vendor actually served. */
  revenue: number
  /** Value of cancelled orders. */
  lost: number
  /** Money actually taken by Razorpay. This is the payout basis. */
  received: number
  /** Placed but never paid — must never be treated as earnings. */
  awaiting: number
  /** Paid, then refunded. Received but not the vendor's to keep. */
  refunded: number
}

function summarise(rows: SummaryRow[]): RangeSummary {
  let completed = 0
  let active = 0
  let cancelled = 0
  // Accumulate in paise; see lib/money.ts.
  let revenue = 0
  let lost = 0
  let received = 0
  let awaiting = 0
  let refunded = 0

  for (const o of rows) {
    const paise = toPaise(o.total_amount)

    // Fulfilment state — what happened to the order.
    if (o.status === 'collected') {
      completed++
      revenue += paise
    } else if (o.status === 'cancelled') {
      cancelled++
      lost += paise
    } else {
      active++
    }

    // Money state — tracked separately, because an order can be paid but not
    // yet collected, or collected while still unpaid. Conflating the two is how
    // a payout ends up wrong.
    if (o.payment_status === 'paid') {
      received += paise
    } else if (o.payment_status === 'refund_initiated') {
      refunded += paise
    } else {
      awaiting += paise
    }
  }

  return {
    orders: rows.length,
    completed,
    active,
    cancelled,
    revenue: fromPaise(revenue),
    lost: fromPaise(lost),
    received: fromPaise(received),
    awaiting: fromPaise(awaiting),
    refunded: fromPaise(refunded),
  }
}

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, 'vendor-summary', 60, 60_000)
  if (limited) return limited

  const cafId = req.nextUrl.searchParams.get('cafeteriaId')
  const dateParam = req.nextUrl.searchParams.get('date')
  if (!cafId) return NextResponse.json({ error: 'Missing cafeteriaId' }, { status: 400 })

  // Same gate as the orders list — identity comes from the verified session
  // token, never the request body.
  const auth = await requireVendorForCafeteria(req, cafId)
  if ('error' in auth) {
    const status = authErrorStatus(auth.error)
    return NextResponse.json(
      { error: status === 404 ? 'Cafeteria not found' : 'Unauthorized' },
      { status }
    )
  }

  // Only the four fields the totals need — no customer PII leaves the server.
  // This reads every order for the cafeteria; at LETHAFI's current volume that
  // is tens of rows. If it ever reaches tens of thousands, move the arithmetic
  // into a Postgres aggregate rather than paginating this.
  const { data, error } = await adminSupabase
    .from('orders')
    .select('status,payment_status,total_amount,created_at')
    .eq('cafeteria_id', cafId)

  if (error) {
    logger.error('Vendor summary query failed:', error)
    return NextResponse.json({ error: 'Failed to load summary.' }, { status: 500 })
  }

  const rows = (data ?? []) as SummaryRow[]
  let dayStart = istDayStart()

  // If a specific date is provided, calculate summary for that date
  if (dateParam) {
    const parsed = new Date(dateParam + 'T00:00:00Z')
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }
    dayStart = new Date(parsed.getTime() + (5.5 * 60 * 60 * 1000))
    dayStart.setUTCHours(0, 0, 0, 0)
    dayStart = new Date(dayStart.getTime() - (5.5 * 60 * 60 * 1000))
  }

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const selectedDateRows = rows.filter(o => o.created_at && new Date(o.created_at) >= dayStart && new Date(o.created_at) < dayEnd)

  return NextResponse.json({
    today: dateParam ? summarise(selectedDateRows) : summarise(selectedDateRows),
    allTime: summarise(rows),
    dayStart: dayStart.toISOString(),
  })
}
