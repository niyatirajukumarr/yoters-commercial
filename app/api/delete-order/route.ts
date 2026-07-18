import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'delete-order', 20, 60_000)
    if (limited) return limited

    const { orderId, studentPhone } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // Fetch the order so we can validate ownership and status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, student_phone')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only the customer who placed the order can delete it. The phone must be
    // supplied and must match — previously an omitted studentPhone skipped the
    // check entirely, letting anyone delete another customer's order.
    if (!studentPhone || order.student_phone !== studentPhone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only non-active orders can be deleted (never an in-progress/paid order)
    const deletableStatuses = ['pending', 'cancelled', 'collected']
    if (!deletableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot delete ${order.status} orders` },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (deleteError) {
      logger.error('Delete order failed:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete order.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    logger.error('Delete order error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
