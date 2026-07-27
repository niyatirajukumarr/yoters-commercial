import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAdminClient, requireVendorForOrder, authErrorStatus } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { notifyStudentPaymentPending } from '@/lib/notifications'

const supabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'remind-payment', 30, 60_000)
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
    const { order, ctx } = auth

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'This order is already paid.' }, { status: 400 })
    }

    // Stamped so the customer's own order card can show "won't be confirmed
    // until paid" without needing a notifications inbox UI.
    await supabase.from('orders').update({ payment_reminder_sent_at: new Date().toISOString() }).eq('id', orderId)
    await notifyStudentPaymentPending(order.student_phone, orderId, ctx.cafeteria.name)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Remind payment error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
