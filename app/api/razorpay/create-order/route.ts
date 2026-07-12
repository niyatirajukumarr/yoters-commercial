import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createRazorpayOrder } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, amount, studentEmail, studentPhone, studentName } = body

    if (!orderId || !amount || !studentEmail || !studentPhone || !studentName) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: orderId, amount, studentEmail, studentPhone, studentName',
        },
        { status: 400 }
      )
    }

    // amount is in INR rupees at this API boundary (converted to paise in createRazorpayOrder).
    // Razorpay's minimum order amount is 100 paise (₹1).
    if (amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least ₹1 (100 paise)' },
        { status: 400 }
      )
    }

    // Fetch order to verify it exists
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

    // Check if we already have a Razorpay order ID for this order (from a previous attempt)
    if (order.razorpay_order_id) {
      console.log(`[Razorpay] Order ${orderId} already has Razorpay ID: ${order.razorpay_order_id}`)
      return NextResponse.json(
        {
          success: true,
          razorpayOrderId: order.razorpay_order_id,
          message: 'Returning existing order',
        },
        { status: 200 }
      )
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      orderId,
      amount,
      studentEmail,
      studentPhone,
      studentName
    )

    // Store Razorpay order ID in our database
    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error storing Razorpay order ID:', updateError)
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
    const fullError = JSON.stringify(error, Object.getOwnPropertyNames(error))
    console.error('Create order error FULL:', fullError)
    const msg = error?.message ?? error?.error?.description ?? error?.description ?? fullError

    // Razorpay returns 401 for bad/missing key_id or key_secret
    const isAuthFailure =
      error?.statusCode === 401 || error?.error?.code === 'BAD_REQUEST_ERROR' && /key|auth/i.test(msg)
    if (isAuthFailure) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed: ' + msg },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create payment order: ' + msg },
      { status: 500 }
    )
  }
}
