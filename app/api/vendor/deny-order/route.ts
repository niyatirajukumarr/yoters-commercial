import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
import { notifyStudentOrderDenied, notifyManagerVendorDenied } from '@/lib/notifications'
import { refundPayment } from '@/lib/razorpay'
import { logger, shortId } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, vendorEmail, denialReason } = body

    if (!orderId || !vendorEmail || !denialReason) {
      return NextResponse.json(
        { error: 'Missing orderId, vendorEmail, or denialReason' },
        { status: 400 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify vendor owns this cafeteria
    const { data: cafeteria, error: cafError } = await supabase
      .from('cafeterias')
      .select('*')
      .eq('id', order.cafeteria_id)
      .eq('vendor_email', vendorEmail)
      .single()

    if (cafError || !cafeteria) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

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
      await supabase.from('orders').update({ payment_status: 'refund_initiated' }).eq('id', orderId)
      try {
        await refundPayment(order.razorpay_payment_id, order.total_amount)
        logger.debug('Refund requested for order', shortId(orderId))
      } catch (refundError: any) {
        logger.error('Refund request error:', refundError)
        // Keep as refund_initiated so it can be retried; do not mark successful.
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
