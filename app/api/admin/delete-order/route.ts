import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, getAdminClient } from '@/lib/auth-server'
import { isAdmin } from '@/lib/config'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'admin-delete-order', 10, 60_000)
  if (limited) return limited

  // SECURITY: Authenticate user
  const user = await getAuthedUser(req)
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // SECURITY: Verify admin role
  if (!isAdmin(user.email)) {
    logger.error('[admin/delete-order] Unauthorized attempt by', shortId(user.email))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { orderId } = await req.json()
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
  }

  // Execute with audit log
  const admin = getAdminClient()
  const { error } = await admin.from('orders').delete().eq('id', orderId)

  if (error) {
    logger.error('[admin/delete-order] Delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }

  logger.warn('[admin/delete-order] Order deleted by admin', user.email, 'orderId:', shortId(orderId))
  return NextResponse.json({ success: true })
}
