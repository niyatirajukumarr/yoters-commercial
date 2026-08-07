import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, getAdminClient } from '@/lib/auth-server'
import { isAdmin } from '@/lib/config'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getPaymentDetails } from '@/lib/razorpay'

const adminSupabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'admin-verify-payment', 10, 60_000)
    if (limited) return limited

    // SECURITY: Strict authentication (payment fraud risk)
    const user = await getAuthedUser(req)
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Verify admin role (admin-only for payment changes)
    if (!isAdmin(user.email)) {
      logger.error('[admin/verify-stuck-payment] Unauthorized attempt by', shortId(user.email))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { orderId, razorpay_payment_id } = await req.json()

    if (!orderId || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing orderId or razorpay_payment_id' }, { status: 400 })
    }

    // SECURITY: Verify payment actually exists in Razorpay (anti-fraud)
    try {
      const paymentDetails = await getPaymentDetails(razorpay_payment_id)
      if (paymentDetails.status !== 'captured') {
        logger.error('[admin/verify-stuck-payment] Payment not captured. Status:', paymentDetails.status)
        return NextResponse.json(
          { error: `Payment status is ${paymentDetails.status}, not captured. Not marking order as paid.` },
          { status: 400 }
        )
      }
      logger.debug('[admin/verify-stuck-payment] Razorpay verified payment', shortId(razorpay_payment_id))
    } catch (err) {
      logger.error('[admin/verify-stuck-payment] Razorpay lookup failed:', err)
      return NextResponse.json(
        { error: 'Could not verify payment with Razorpay. Payment may be fraudulent.' },
        { status: 502 }
      )
    }

    // SECURITY: Verify order exists
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, razorpay_order_id, payment_status, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      logger.error('[admin/verify-stuck-payment] Order not found:', shortId(orderId))
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // SECURITY: Prevent double-payment marking
    if (order.payment_status === 'paid') {
      logger.error('[admin/verify-stuck-payment] Duplicate payment attempt for', shortId(orderId))
      return NextResponse.json(
        { error: 'Order already marked as paid' },
        { status: 400 }
      )
    }

    // Only then mark as paid (with full audit)
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'pending_approval',
        razorpay_payment_id,
      })
      .eq('id', orderId)

    if (updateError) {
      logger.error('[admin/verify-stuck-payment] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to mark payment as verified' }, { status: 500 })
    }

    logger.error('[admin/verify-stuck-payment] MANUAL PAYMENT VERIFICATION by', user.email, {
      orderId: shortId(orderId),
      amount: order.total_amount,
      razorpayPaymentId: shortId(razorpay_payment_id),
    })
    return NextResponse.json({ success: true, message: 'Payment manually verified and order marked paid' })
  } catch (error: any) {
    logger.error('[admin/verify-stuck-payment] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
