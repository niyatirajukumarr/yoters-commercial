import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

// Webhooks run server-side with no user session; use the service-role client so
// order updates work regardless of RLS.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'razorpay-webhook', 60, 60_000)
    if (limited) return limited

    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    logger.debug('[Razorpay Webhook] Received event')

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      logger.error('[Razorpay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    logger.debug('[Razorpay Webhook] Event type:', event.event)

    // Handle payment.authorized event
    if (event.event === 'payment.authorized') {
      const { payment_id, order_id } = event.payload.payment.entity

      logger.debug('[Razorpay Webhook] Payment authorized:', {
        paymentId: shortId(payment_id),
        orderId: shortId(order_id),
      })

      // Find order by razorpay_order_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, cafeterias(upi_id, name)')
        .eq('razorpay_order_id', order_id)
        .single()

      if (orderError || !order) {
        logger.error('[Razorpay Webhook] Order not found:', shortId(order_id))
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Update order status to 'paid'
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          razorpay_payment_id: payment_id,
        })
        .eq('id', order.id)

      if (updateError) {
        logger.error('[Razorpay Webhook] Error updating order:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        )
      }

      logger.debug('[Razorpay Webhook] Order updated to paid:', shortId(order.id))

      // TODO: Implement vendor payouts when Razorpay setup is complete
      // For now, payouts are paused - will be implemented later

      // Send notification to student
      try {
        await supabase
          .from('notifications')
          .insert({
            recipient_type: 'student',
            recipient_id: order.student_phone,
            order_id: order.id,
            notification_type: 'payment_confirmed',
            message: `Payment confirmed for ₹${order.total_amount}. Your order is being prepared.`,
            read: false,
          })
      } catch (notifError) {
        logger.error('[Razorpay Webhook] Notification error:', notifError)
      }

      return NextResponse.json(
        { success: true, message: 'Payment processed' },
        { status: 200 }
      )
    }

    // Handle refund lifecycle events. A denied order requests a refund and is
    // left at `refund_initiated`; only once Razorpay confirms settlement here do
    // we promote it to `refund_successful`.
    if (event.event === 'refund.processed') {
      const refundEntity = event.payload.refund?.entity
      const refundedPaymentId = refundEntity?.payment_id
      if (refundedPaymentId) {
        const { error: refundUpdateError } = await supabase
          .from('orders')
          .update({ payment_status: 'refund_successful' })
          .eq('razorpay_payment_id', refundedPaymentId)
        if (refundUpdateError) {
          logger.error('[Razorpay Webhook] Failed to mark refund successful:', refundUpdateError)
        } else {
          logger.debug('[Razorpay Webhook] Refund settled for payment', shortId(refundedPaymentId))
        }
      }
      return NextResponse.json(
        { success: true, message: 'Refund settlement recorded' },
        { status: 200 }
      )
    }

    if (event.event === 'refund.failed') {
      const refundEntity = event.payload.refund?.entity
      const refundedPaymentId = refundEntity?.payment_id
      if (refundedPaymentId) {
        // Leave the order at `refund_initiated` so it can be retried, but log it
        // for operator follow-up.
        logger.error('[Razorpay Webhook] Refund FAILED for payment', shortId(refundedPaymentId))
      }
      return NextResponse.json(
        { success: true, message: 'Refund failure recorded' },
        { status: 200 }
      )
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const { payment_id, order_id } = event.payload.payment.entity
      const reason = event.payload.payment.entity.error_reason || 'Unknown error'

      logger.debug('[Razorpay Webhook] Payment failed:', {
        paymentId: shortId(payment_id),
        orderId: shortId(order_id),
      })

      // Find and update order
      const { data: order } = await supabase
        .from('orders')
        .select('student_phone')
        .eq('razorpay_order_id', order_id)
        .single()

      if (order) {
        // Send notification about failed payment
        await supabase
          .from('notifications')
          .insert({
            recipient_type: 'student',
            recipient_id: order.student_phone,
            notification_type: 'payment_failed',
            message: `Payment failed: ${reason}. Please retry.`,
            read: false,
          })
      }

      return NextResponse.json(
        { success: true, message: 'Payment failure recorded' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Event received' },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error('[Razorpay Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 }
    )
  }
}
