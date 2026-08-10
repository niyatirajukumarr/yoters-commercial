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

    // Bounded to the last 30 days. Unbounded, this query grew with the order
    // table forever — at 300 orders a day per restaurant it was scanning
    // months of history to decide which dishes get a "Highly ordered" tag.
    // A month is also a better signal: what sold last summer is not what is
    // popular now. Cancelled orders are excluded in SQL rather than in JS so
    // they never cross the wire.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('orders')
      .select('items')
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', since)
      .neq('status', 'cancelled')

    if (error) {
      logger.error('Menu popularity query error:', error)
      return NextResponse.json({ error: 'Failed to load menu popularity.' }, { status: 500 })
    }

    const byName: Record<string, number> = {}
    const byId: Record<string, number> = {}

    ;(data || []).forEach((o: any) => {
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

    // Cached at the edge: every viewer of a restaurant asks for the same
    // numbers, so they share one origin query per minute however many of them
    // there are. stale-while-revalidate means a rush never waits on a refresh.
    return NextResponse.json(
      { byName, byId, max },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (e: any) {
    logger.error('Menu popularity error:', e)
    return NextResponse.json({ error: 'Failed to load menu popularity.' }, { status: 500 })
  }
}
