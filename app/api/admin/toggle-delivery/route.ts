import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, getAdminClient } from '@/lib/auth-server'
import { isAdmin } from '@/lib/config'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

const adminSupabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'admin-toggle-delivery', 20, 60_000)
    if (limited) return limited

    // SECURITY: Authenticate user
    const user = await getAuthedUser(req)
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Verify admin role
    if (!isAdmin(user.email)) {
      logger.error('[admin/toggle-delivery] Unauthorized attempt by', shortId(user.email))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { cafeteriaId, delivery_available } = await req.json()

    if (!cafeteriaId || delivery_available === undefined) {
      return NextResponse.json({ error: 'Missing cafeteriaId or delivery_available' }, { status: 400 })
    }

    // Update cafeteria delivery status
    const { error: updateError, data } = await adminSupabase
      .from('cafeterias')
      .update({ delivery_available })
      .eq('id', cafeteriaId)
      .select()

    if (updateError) {
      logger.error('[admin/toggle-delivery] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update delivery status.' }, { status: 500 })
    }

    logger.debug('[admin/toggle-delivery] Updated by', user.email, { cafeteriaId, delivery_available })
    return NextResponse.json({
      success: true,
      message: `Delivery ${delivery_available ? 'enabled' : 'disabled'}`,
      cafeteria: data?.[0],
    })
  } catch (error: any) {
    logger.error('[admin/toggle-delivery] Error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
