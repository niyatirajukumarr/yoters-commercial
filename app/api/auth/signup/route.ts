import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signupSchema, AUTH_MESSAGES } from '@/lib/auth-schemas'
import { sanitizeEmail, sanitizeText, sanitizePhone } from '@/lib/sanitize'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getAdminClient } from '@/lib/auth-server'
import { logger, shortId } from '@/lib/logger'

function authClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'auth-signup', 10, 60_000)
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: AUTH_MESSAGES.invalidInput }, { status: 400 })
  }

  // Validate format + length on the server for every field.
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    logger.error('[auth/signup] validation failed', {
      fields: parsed.error.issues.map(i => i.path.join('.')),
    })
    // Generic — never say which field was invalid.
    return NextResponse.json({ error: AUTH_MESSAGES.invalidInput }, { status: 400 })
  }

  // Sanitize: strip HTML/script/control chars before use/storage.
  const email = sanitizeEmail(parsed.data.email)
  const name = sanitizeText(parsed.data.name)
  const phone = sanitizePhone(parsed.data.phone)
  const { password } = parsed.data

  const supabase = authClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    // Do NOT confirm whether the email already exists — generic failure only.
    logger.error('[auth/signup] sign-up failed for', shortId(email))
    return NextResponse.json({ error: AUTH_MESSAGES.signupFailed }, { status: 400 })
  }

  // Store only non-sensitive profile metadata (never the password).
  if (data.user) {
    try {
      await getAdminClient().from('profiles').upsert({
        id: data.user.id,
        name,
        phone: phone || null,
        email,
      })
    } catch (e) {
      logger.error('[auth/signup] profile upsert failed:', e)
    }
  }

  // If Supabase auto-confirms (email confirmation disabled), a session is
  // returned and the client establishes it. Otherwise the user must confirm by
  // email first. Either way the response text is the same shape.
  return NextResponse.json(
    {
      success: true,
      session: data.session
        ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
        : null,
    },
    { status: 200 }
  )
}
