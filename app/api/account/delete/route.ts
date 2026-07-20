import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, getAdminClient } from '@/lib/auth-server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { logger, shortId } from '@/lib/logger'

// DPDP right to erasure / consent withdrawal (s.6(4), s.12): an authenticated
// Data Principal can delete their account and personal data.
//
// Active, paid-but-unfulfilled orders are NOT hard-deleted (we must retain them
// to complete fulfilment / financial reconciliation); instead their personal
// identifiers are anonymised. Historical/finished orders' PII is anonymised so
// aggregate stats survive without identifying the person. The auth user and
// profile row are removed.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'account-delete', 3, 60_000)
  if (limited) return limited

  const user = await getAuthedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    // Anonymise personal identifiers on the user's orders (preserves order/
    // financial records without retaining who placed them).
    const anonymise = {
      student_name: 'Deleted user',
      student_email: null as string | null,
      student_phone: `deleted-${shortId(user.id)}`,
      delivery_address: null as string | null,
    }
    if (user.email) {
      await admin.from('orders').update(anonymise).eq('student_email', user.email)
    }
    if (profile?.phone) {
      await admin.from('orders').update(anonymise).eq('student_phone', profile.phone)
    }

    // Remove our own metadata row.
    await admin.from('profiles').delete().eq('id', user.id)

    // Remove the auth identity itself (requires service-role key).
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) {
      // Profile + PII already removed; report partial so the user can retry.
      logger.error('[account/delete] auth user delete failed:', delErr)
      return NextResponse.json(
        { error: 'Your data was removed, but finalising account deletion failed. Please contact support.' },
        { status: 502 }
      )
    }

    logger.debug('[account/delete] account erased for', shortId(user.id))
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    logger.error('[account/delete] failed:', e)
    return NextResponse.json({ error: 'Could not delete your account. Please try again.' }, { status: 500 })
  }
}
