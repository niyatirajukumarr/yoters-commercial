import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  try {
    // Find Niyati's test orders
    const { data: orders, error: queryError } = await supabase
      .from('orders')
      .select('id, student_name, status, total_amount')
      .eq('student_name', 'Niyati')
      .in('status', ['collected', 'cancelled', 'pending'])

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    console.log('Found orders:', orders)

    if (orders && orders.length > 0) {
      // Delete all of them
      const ids = orders.map(o => o.id)
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', ids)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: ids.length, ids }, { status: 200 })
    }

    return NextResponse.json({ success: true, deleted: 0 }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
