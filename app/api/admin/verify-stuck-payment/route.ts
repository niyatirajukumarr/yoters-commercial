import { NextRequest, NextResponse } from 'next/server'
import { logger, shortId } from '@/lib/logger'
import { getAdminClient } from '@/lib/auth-server'

const adminSupabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpay_payment_id } = await req.json()

    if (!orderId || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing orderId or razorpay_payment_id' }, { status: 400 })
    }

    // Update order directly - mark as paid and pending approval
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'pending_approval',
        razorpay_payment_id,
      })
      .eq('id', orderId)

    if (updateError) {
      logger.error('Error updating stuck order:', updateError)
      return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 })
    }

    logger.debug('Manually verified stuck payment:', { orderId: shortId(orderId), paymentId: razorpay_payment_id })
    return NextResponse.json({ success: true, message: 'Payment manually verified' })
  } catch (error: any) {
    logger.error('Admin verify stuck payment error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
