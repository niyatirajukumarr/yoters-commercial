import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  const cafId = req.nextUrl.searchParams.get('cafeteriaId')
  if (!cafId) return NextResponse.json({ error: 'Missing cafeteriaId' }, { status: 400 })

  const { data, error } = await adminSupabase
    .from('orders')
    .select('*')
    .eq('cafeteria_id', cafId)
    .eq('payment_status', 'paid')
    .in('status', ['paid', 'approved', 'preparing', 'ready'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}
