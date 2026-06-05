import { createClient } from '@supabase/supabase-js'
import { notifyStudentOrderApproved } from '@/lib/notifications'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, vendorEmail, prepTimeMinutes } = body

    if (!orderId || !vendorEmail) {
      return NextResponse.json(
        { error: 'Missing orderId or vendorEmail' },
        { status: 400 }
      )
    }

    if (!prepTimeMinutes || prepTimeMinutes < 1 || prepTimeMinutes > 120) {
      return NextResponse.json(
        { error: 'Prep time must be between 1 and 120 minutes' },
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

    // Update order status to 'preparing' with prep time
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'preparing',
        approved_at: new Date().toISOString(),
        prep_time_minutes: prepTimeMinutes,
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to approve order: ' + updateError.message },
        { status: 500 }
      )
    }

    // Send notification to student
    await notifyStudentOrderApproved(order.student_phone, orderId, cafeteria.name)

    return NextResponse.json(
      {
        success: true,
        message: 'Order approved successfully',
        order: { id: orderId, status: 'approved' },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Approve order error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
