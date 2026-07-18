import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRazorpayOrder } from '@/lib/razorpay'
import { logger } from '@/lib/logger'
import { isValidEmail, isValidPhone, isValidAmount, isNonEmptyString } from '@/lib/validation'

// Service-role client: this route reads the order and writes the Razorpay order
// id, which must work even once RLS is tightened to owner-scoped policies.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, amount, studentEmail, studentPhone, studentName } = body

    if (!orderId || !amount || !studentEmail || !studentPhone || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    // Validate formats/ranges server-side — never trust client-supplied values.
    if (!isValidEmail(studentEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (!isValidPhone(studentPhone)) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 })
    }
    if (!isNonEmptyString(studentName, 120)) {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 })
    }
    // amount is in INR rupees at this boundary (converted to paise downstream).
    if (!isValidAmount(amount, { min: 1, max: 100000 })) {
      return NextResponse.json(
        { error: 'Amount must be between ₹1 and ₹100000.' },
        { status: 400 }
      )
    }

    // Fetch order to verify it exists, and cross-check the amount against the
    // server-side record so a tampered client cannot pay an arbitrary total.
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, total_amount, razorpay_order_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // Trust the stored order total, not the client-provided amount.
    const authoritativeAmount = Number(order.total_amount)
    if (!isValidAmount(authoritativeAmount, { min: 1, max: 100000 })) {
      return NextResponse.json({ error: 'Order has an invalid total.' }, { status: 400 })
    }

    // Check if we already have a Razorpay order ID (from a previous attempt)
    if (order.razorpay_order_id) {
      return NextResponse.json(
        {
          success: true,
          razorpayOrderId: order.razorpay_order_id,
          razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          message: 'Returning existing order',
        },
        { status: 200 }
      )
    }

    // Create Razorpay order using the authoritative amount.
    const razorpayOrder = await createRazorpayOrder(
      orderId,
      authoritativeAmount,
      studentEmail,
      studentPhone,
      studentName
    )

    // Store Razorpay order ID in our database
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderId)

    if (updateError) {
      logger.error('Error storing Razorpay order ID:', updateError)
    }

    return NextResponse.json(
      {
        success: true,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        message: 'Order created successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    // Log full detail server-side only; return a generic message to the client.
    logger.error('Create order error:', error)
    const isAuthFailure =
      error?.statusCode === 401 ||
      (error?.error?.code === 'BAD_REQUEST_ERROR' && /key|auth/i.test(error?.error?.description || ''))
    if (isAuthFailure) {
      return NextResponse.json(
        { error: 'Payment gateway is temporarily unavailable. Please try again later.' },
        { status: 502 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    )
  }
}
