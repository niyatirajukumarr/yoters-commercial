import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { logger, shortId } from '@/lib/logger'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
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

    // Signature confirmed genuine -> safe to mark the order as paid
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
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
