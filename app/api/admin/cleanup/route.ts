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
      console.error('[cleanup] Query failed:', queryError)
      return NextResponse.json(
        { error: 'Could not process request. Please try again.' },
        { status: 500 }
      )
    }

    if (orders && orders.length > 0) {
      // Delete all of them
      const ids = orders.map(o => o.id)
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', ids)

      if (deleteError) {
        console.error('[cleanup] Delete failed:', deleteError)
        return NextResponse.json(
          { error: 'Could not process request. Please try again.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, deleted: ids.length, ids }, { status: 200 })
    }

    return NextResponse.json({ success: true, deleted: 0 }, { status: 200 })
  } catch (error: any) {
    console.error('[cleanup] Error:', error)
    return NextResponse.json(
      { error: 'Could not process request. Please try again.' },
      { status: 500 }
    )
  }
}
