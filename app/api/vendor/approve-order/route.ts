import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { orderId, vendorEmail, prepTimeMinutes } = await req.json()
    if (!orderId || !vendorEmail) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { error } = await supabase
      .from('orders')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) return NextResponse.json({ error: 'Failed to approve order: ' + error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
