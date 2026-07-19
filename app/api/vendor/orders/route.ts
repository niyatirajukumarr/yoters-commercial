import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAdminClient, requireVendorForCafeteria, authErrorStatus } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'

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

  const { data, error } = await adminSupabase
    .from('orders')
    .select('*')
    .eq('cafeteria_id', cafId)
    .eq('payment_status', 'paid')
    .in('status', ['paid', 'approved', 'preparing', 'ready'])
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Vendor orders query failed:', error)
    return NextResponse.json({ error: 'Failed to load orders.' }, { status: 500 })
  }
  return NextResponse.json({ orders: data })
}
