import { NextRequest, NextResponse } from 'next/server'
import { logger, shortId } from '@/lib/logger'
import { getAdminClient } from '@/lib/auth-server'

const adminSupabase = getAdminClient()

export async function POST(req: NextRequest) {
  try {
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
      logger.error('Error toggling delivery:', updateError)
      return NextResponse.json({ error: 'Failed to update delivery status.' }, { status: 500 })
    }

    logger.debug('Toggled delivery status:', { cafeteriaId: shortId(cafeteriaId), delivery_available })
    return NextResponse.json({
      success: true,
      message: `Delivery ${delivery_available ? 'enabled' : 'disabled'}`,
      cafeteria: data?.[0],
    })
  } catch (error: any) {
    logger.error('Admin toggle delivery error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
