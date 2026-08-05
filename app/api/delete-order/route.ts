import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, getAdminClient } from '@/lib/auth-server'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // FIX #1: Tighter rate limiting (5 per minute instead of 20)
    const limited = enforceRateLimit(req, 'delete-order', 5, 60_000)
    if (limited) return limited

    // FIX #2: Require authentication - endpoint must not be anonymous
    const user = await getAuthedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Fetch the order to validate ownership and status
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, status, student_phone, student_email')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // FIX #3: Verify ownership using authenticated user's session data, not request body
    // Fetch authenticated user's profile
    const { data: profile } = await admin
      .from('profiles')
      .select('email, phone')
      .eq('id', user.id)
      .single()

    // Check if user owns this order (by email or phone from their session)
    const owns =
      (user.email && order.student_email === user.email) ||
      (profile?.phone && order.student_phone === profile.phone)

    if (!owns) {
      logger.error('[delete-order] Unauthorized access attempt for order:', shortId(orderId))
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

    const { error: deleteError } = await admin
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (deleteError) {
      logger.error('[delete-order] Delete failed:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete order.' },
        { status: 500 }
      )
    }

    logger.debug('[delete-order] Order deleted by', shortId(user.id))
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    logger.error('[delete-order] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
