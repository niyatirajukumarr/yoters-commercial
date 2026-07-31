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

  // Fetch ALL of today's orders (active + completed + cancelled/denied).
  // "Today" is the Indian calendar day — setHours() here meant midnight in the
  // server's zone, which on Vercel is UTC, i.e. 05:30 IST.
  const todayStart = istDayStart()

  // Auto-mark pending_payment orders as payment_pending if 60+ seconds old
  const { error: autoMarkError } = await adminSupabase.rpc('auto_mark_payment_pending')
  if (autoMarkError) {
    logger.warn('Failed to auto-mark payment pending:', autoMarkError)
  }

  const { data, error } = await adminSupabase
    .from('orders')
    .select('*')
    .eq('cafeteria_id', cafId)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Vendor orders query failed:', error)
    return NextResponse.json({ error: 'Failed to load orders.' }, { status: 500 })
  }
  return NextResponse.json({ orders: data })
}
