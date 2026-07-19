import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminClient } from '@/lib/auth-server'
import { logger, shortId } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limit'

// Lifecycle webhook for user creation/deletion.
//
// Configure in Supabase: Database → Webhooks → create a webhook on the
// `auth.users` table (INSERT + DELETE) that POSTs here with a custom header
// `x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>`. We keep ONLY non-sensitive
// metadata in our own `profiles` table (id/email/name/phone) — never passwords
// or tokens.

function validSecret(req: NextRequest): boolean {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET
  if (!expected) return false
  const got = req.headers.get('x-webhook-secret') || ''
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  // Constant-time comparison.
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'auth-webhook', 60, 60_000)
  if (limited) return limited

  if (!validSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Supabase DB webhook shape: { type: 'INSERT'|'DELETE', table, record, old_record }
  const type = payload?.type
  const record = payload?.record
  const oldRecord = payload?.old_record
  const admin = getAdminClient()

  try {
    if (type === 'INSERT' && record?.id) {
      // Ensure a profile row exists for the new user (idempotent).
      await admin.from('profiles').upsert({
        id: record.id,
        email: record.email ?? null,
      })
      logger.debug('[auth/webhook] provisioned profile for', shortId(record.id))
    } else if (type === 'DELETE' && oldRecord?.id) {
      // Remove our metadata when the auth user is deleted.
      await admin.from('profiles').delete().eq('id', oldRecord.id)
      logger.debug('[auth/webhook] removed profile for', shortId(oldRecord.id))
    }
  } catch (e) {
    logger.error('[auth/webhook] processing error:', e)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
