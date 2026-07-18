import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Aggregate how many times each menu item has been ordered at a cafeteria,
// so the menu can show a real-time "Highly ordered" indicator.
export async function GET(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, 'menu-popularity', 60, 60_000)
    if (limited) return limited

    const cafeteriaId = req.nextUrl.searchParams.get('cafeteriaId')
    if (!cafeteriaId) {
      return NextResponse.json({ error: 'Missing cafeteriaId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .select('items, status')
      .eq('cafeteria_id', cafeteriaId)

    if (error) {
      logger.error('Menu popularity query error:', error)
      return NextResponse.json({ error: 'Failed to load menu popularity.' }, { status: 500 })
    }

    const byName: Record<string, number> = {}
    const byId: Record<string, number> = {}

    ;(data || []).forEach((o: any) => {
      if (o.status === 'cancelled') return
      ;(o.items || []).forEach((it: any) => {
        const qty = Number(it?.quantity) || 1
        if (it?.name) {
          const k = String(it.name).toLowerCase()
          byName[k] = (byName[k] || 0) + qty
        }
        if (it?.menu_item_id) {
          byId[it.menu_item_id] = (byId[it.menu_item_id] || 0) + qty
        }
      })
    })

    const values = Object.values(byName)
    const max = values.length ? Math.max(...values) : 0

    return NextResponse.json({ byName, byId, max }, { status: 200 })
  } catch (e: any) {
    logger.error('Menu popularity error:', e)
    return NextResponse.json({ error: 'Failed to load menu popularity.' }, { status: 500 })
  }
}
