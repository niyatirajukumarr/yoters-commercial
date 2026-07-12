import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyWebhookSignature, getPaymentDetails } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    console.log('[Razorpay Webhook] Received event')

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('[Razorpay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    console.log('[Razorpay Webhook] Event type:', event.event)

    // Handle payment.authorized event
    if (event.event === 'payment.authorized') {
      const { payment_id, order_id } = event.payload.payment.entity

      console.log('[Razorpay Webhook] Payment authorized:', {
        paymentId: payment_id,
        orderId: order_id,
      })

      // Get full payment details
      const paymentDetails = await getPaymentDetails(payment_id)

      // Find order by razorpay_order_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, cafeterias(upi_id, name)')
        .eq('razorpay_order_id', order_id)
        .single()

      if (orderError || !order) {
        console.error('[Razorpay Webhook] Order not found:', order_id)
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
        console.error('[Razorpay Webhook] Error updating order:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        )
      }

      console.log('[Razorpay Webhook] Order updated to paid:', order.id)

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
        console.error('[Razorpay Webhook] Notification error:', notifError)
      }

      return NextResponse.json(
        { success: true, message: 'Payment processed' },
        { status: 200 }
      )
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const { payment_id, order_id } = event.payload.payment.entity
      const reason = event.payload.payment.entity.error_reason || 'Unknown error'

      console.log('[Razorpay Webhook] Payment failed:', {
        paymentId: payment_id,
        orderId: order_id,
        reason,
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
    console.error('[Razorpay Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed: ' + error.message },
      { status: 500 }
    )
  }
}
