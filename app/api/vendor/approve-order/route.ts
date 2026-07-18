import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { orderId, vendorEmail, prepTimeMinutes } = await req.json()
    if (!orderId || !vendorEmail) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Verify the caller's vendor owns the cafeteria this order belongs to before
    // mutating it — otherwise any caller could approve any order.
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, cafeteria_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    const { data: cafeteria, error: cafError } = await supabase
      .from('cafeterias')
      .select('id')
      .eq('id', order.cafeteria_id)
      .eq('vendor_email', vendorEmail)
      .single()

    if (cafError || !cafeteria) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('cafeteria_id', order.cafeteria_id)

    if (error) {
      logger.error('Approve order failed:', error)
      return NextResponse.json({ error: 'Failed to approve order.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Approve order error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
