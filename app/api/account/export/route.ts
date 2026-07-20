import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, getAdminClient } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { logger, shortId } from '@/lib/logger'

// DPDP right of access / data portability (s.11): an authenticated Data
// Principal can download a machine-readable copy of the personal data we hold
// about them. Identity comes from the verified session bearer token — never a
// body field.
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, 'account-export', 5, 60_000)
  if (limited) return limited

  const user = await getAuthedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Orders are keyed by the contact details used at checkout.
    const orFilters: string[] = []
    if (user.email) orFilters.push(`student_email.eq.${user.email}`)
    if (profile?.phone) orFilters.push(`student_phone.eq.${profile.phone}`)

    let orders: unknown[] = []
    if (orFilters.length) {
      const { data } = await admin.from('orders').select('*').or(orFilters.join(','))
      orders = data ?? []
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      profile: profile ?? null,
      orders,
      notice:
        'This export contains the personal data Yoters holds about you (DPDP Act, 2023). ' +
        'To request corrections or deletion, use Settings → Your data & privacy.',
    }

    logger.debug('[account/export] export generated for', shortId(user.id))
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="yoters-my-data.json"',
      },
    })
  } catch (e) {
    logger.error('[account/export] failed:', e)
    return NextResponse.json({ error: 'Could not export your data. Please try again.' }, { status: 500 })
  }
}
