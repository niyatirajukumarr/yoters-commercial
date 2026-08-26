import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Public, no-login endpoint backing app/delivery/[orderId] — the link a
// vendor shares with a delivery person. Trust model matches the existing
// customer order-tracking page: the order id (a UUID) is the only thing
// gating access, not a session. Only delivery-type orders resolve, and only
// the fields a delivery person actually needs are returned — not the full
// order row (no cafeteria_id, payment ids, denial reasons, etc).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const limited = enforceRateLimit(req, 'delivery-info', 30, 60_000)
  if (limited) return limited

  const { orderId } = await params
  const admin = getAdminClient()

  try {
    const { data: order, error } = await admin
      .from('orders')
      .select('student_name, student_phone, items, total_amount, token_number, order_type, delivery_address, delivery_latitude, delivery_longitude, payment_status, cafeteria_id')
      .eq('id', orderId)
      .single()

    if (error || !order || order.order_type !== 'delivery') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: cafeteria } = await admin
      .from('cafeterias')
      .select('name')
      .eq('id', order.cafeteria_id)
      .single()

    return NextResponse.json({
      cafeteriaName: cafeteria?.name ?? '',
      customerName: order.student_name,
      phone: order.student_phone,
      items: order.items,
      totalAmount: order.total_amount,
      tokenNumber: order.token_number,
      isPrepaid: order.payment_status === 'paid',
      address: order.delivery_address,
      latitude: order.delivery_latitude,
      longitude: order.delivery_longitude,
    })
  } catch (err) {
    logger.error('Delivery info fetch error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
