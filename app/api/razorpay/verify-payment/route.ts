import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'verify-payment', 30, 60_000)
    if (limited) return limited

    const body = await req.json()
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature',
        },
        { status: 400 }
      )
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      logger.error('[Razorpay Verify] Signature mismatch for order:', shortId(orderId))
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed' },
        { status: 400 }
      )
    }

    // FIX #1: Fetch order and verify razorpay_order_id matches (prevents IDOR)
    const { data: order, error: fetchError } = await adminSupabase
      .from('orders')
      .select('id, razorpay_order_id, payment_status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      logger.error('[Razorpay Verify] Order not found:', shortId(orderId))
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // FIX #2: Verify the razorpay_order_id from DB matches what Razorpay sent
    // This prevents signature replay attacks (using valid signature on wrong order)
    if (order.razorpay_order_id !== razorpay_order_id) {
      logger.error(
        '[Razorpay Verify] Signature replay attack detected:',
        `order=${shortId(orderId)}, expected=${shortId(order.razorpay_order_id)}, supplied=${shortId(razorpay_order_id)}`
      )
      return NextResponse.json(
        { success: false, error: 'Payment signature does not match this order' },
        { status: 400 }
      )
    }

    // FIX #3: Prevent double-payment marking
    if (order.payment_status === 'paid') {
      logger.error('[Razorpay Verify] Double-payment attempt on order:', shortId(orderId))
      return NextResponse.json(
        { success: false, error: 'Order already marked as paid' },
        { status: 400 }
      )
    }

    // Signature confirmed genuine and matches this specific order -> safe to mark as pending approval
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'pending_approval',
        razorpay_order_id,
        razorpay_payment_id,
      })
      .eq('id', orderId)

    if (updateError) {
      logger.error('[Razorpay Verify] Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Payment verified' }, { status: 200 })
  } catch (error: any) {
    logger.error('[Razorpay Verify] Error:', error)
    return NextResponse.json(
      { error: 'Payment verification failed.' },
      { status: 500 }
    )
  }
}
