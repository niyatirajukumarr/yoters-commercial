import { notifyStudentOrderDenied, notifyManagerVendorDenied } from '@/lib/notifications'
import { refundPayment } from '@/lib/razorpay'
import { logger, shortId } from '@/lib/logger'
import { isNonEmptyString } from '@/lib/validation'
import { getAdminClient, requireVendorForOrder, authErrorStatus } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

const supabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'deny-order', 30, 60_000)
    if (limited) return limited

    const body = await req.json()
    const { orderId, denialReason } = body

    // Identity is NOT read from the body — it comes from the verified session
    // token. (R7: never trust request-body identity like vendorEmail.)
    if (!orderId || !isNonEmptyString(denialReason, 500)) {
      return NextResponse.json(
        { error: 'Missing orderId or denialReason' },
        { status: 400 }
      )
    }

    const auth = await requireVendorForOrder(req, orderId)
    if ('error' in auth) {
      const status = authErrorStatus(auth.error)
      return NextResponse.json(
        { error: status === 404 ? 'Order not found' : 'Unauthorized' },
        { status }
      )
    }
    const { order, ctx } = auth
    const cafeteria = ctx.cafeteria

    // Update order status to 'cancelled'
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        denied_at: new Date().toISOString(),
        denial_reason: denialReason,
      })
      .eq('id', orderId)

    if (updateError) {
      logger.error('Deny order update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to deny order.' },
        { status: 500 }
      )
    }

    // Process refund if payment was made.
    // The refund is only *requested* here — Razorpay processes it
    // asynchronously. We mark the order `refund_initiated` and leave it there;
    // it is only promoted to `refund_successful` when the `refund.processed`
    // webhook confirms settlement (see app/api/razorpay/webhook/route.ts).
    if (order.payment_status === 'paid' && order.razorpay_payment_id) {
      try {
        const refundResult = await refundPayment(order.razorpay_payment_id, order.total_amount)
        await supabase.from('orders').update({ payment_status: 'refund_initiated' }).eq('id', orderId)
        logger.debug('[deny-order] Refund requested for order', shortId(orderId), 'refund_id:', refundResult.id)
      } catch (refundError: any) {
        logger.error('[deny-order] Refund request failed for order', shortId(orderId), ':', refundError?.message || refundError)
        // Update order status to cancelled but keep payment_status as 'paid' since refund failed
        // This allows manual retry or investigation
        return NextResponse.json(
          { error: `Order cancelled but refund failed: ${refundError?.message || 'Unknown error'}. Contact support.` },
          { status: 500 }
        )
      }
    }

    // Send notifications (non-blocking)
    notifyStudentOrderDenied(order.student_phone, orderId, cafeteria.name, denialReason).catch(() => {})
    notifyManagerVendorDenied(orderId, cafeteria.name, denialReason).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        message: 'Order denied successfully',
        order: { id: orderId, status: 'cancelled' },
      },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error('Deny order error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
