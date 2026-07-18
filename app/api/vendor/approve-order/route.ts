import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAdminClient, requireVendorForOrder, authErrorStatus } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'

const supabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'approve-order', 30, 60_000)
    if (limited) return limited

    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Identity comes from the verified session token, not the request body (R7).
    const auth = await requireVendorForOrder(req, orderId)
    if ('error' in auth) {
      const status = authErrorStatus(auth.error)
      return NextResponse.json(
        { error: status === 404 ? 'Order not found.' : 'Unauthorized' },
        { status }
      )
    }
    const { order } = auth

    const { error } = await supabase
      .from('orders')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('cafeteria_id', order.cafeteria_id)

    if (error) {
      logger.error('Approve order failed:', error)
      return NextResponse.json({ error: 'Failed to approve order.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Approve order error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
