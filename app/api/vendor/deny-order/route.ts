import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import { notifyStudentOrderDenied, notifyManagerVendorDenied } from '@/lib/notifications'
import { refundPayment } from '@/lib/razorpay'
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
      return NextResponse.json(
        { error: 'Failed to deny order: ' + updateError.message },
        { status: 500 }
      )
    }

    // Process refund if payment was made
    if (order.payment_status === 'paid' && order.razorpay_payment_id) {
      try {
        await refundPayment(order.razorpay_payment_id, order.total_amount)
        console.log(`Refund processed for order ${orderId}`)
      } catch (refundError: any) {
        console.error('Refund processing error:', refundError)
        // Continue with denial even if refund fails (can be retried manually)
      }
    }

    // Send notification to student
    await notifyStudentOrderDenied(
      order.student_phone,
      orderId,
      cafeteria.name,
      denialReason
    )

    // Notify manager
    await notifyManagerVendorDenied(orderId, cafeteria.name, denialReason)

    return NextResponse.json(
      {
        success: true,
        message: 'Order denied successfully',
        order: { id: orderId, status: 'cancelled' },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Deny order error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
