import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  const cafId = req.nextUrl.searchParams.get('cafId') ?? 'caf00002-0002-0002-0002-000000000002'

  const { data, error } = await adminSupabase.from('cafeteria_menu').insert({
    cafeteria_id: cafId,
    name: 'Demo',
    description: 'Test item - ₹1',
    price: 1,
    category: 'Demo',
    is_available: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, item: data })
}
