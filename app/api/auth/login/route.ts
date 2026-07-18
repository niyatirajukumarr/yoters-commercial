import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loginSchema, AUTH_MESSAGES } from '@/lib/auth-schemas'
import { sanitizeEmail } from '@/lib/sanitize'
import { enforceRateLimit } from '@/lib/rate-limit'
import { checkLogin, recordFailure, recordSuccess, sendLockoutEmail } from '@/lib/login-guard'
import { logger, shortId } from '@/lib/logger'

// Auth calls use the anon key server-side (same surface as the client would),
// so no elevated privilege is involved in verifying a password.
function authClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const sleep = (ms: number) => (ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve())

export async function POST(req: NextRequest) {
  // R14 / requirement: max 10 requests per IP per minute on /login.
  const limited = enforceRateLimit(req, 'auth-login', 10, 60_000)
  if (limited) return limited

  // Parse + validate on the server regardless of any client-side checks.
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: AUTH_MESSAGES.invalidInput }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    // Log the failure server-side for monitoring (field paths only, never values).
    logger.error('[auth/login] validation failed', {
      fields: parsed.error.issues.map(i => i.path.join('.')),
    })
    // Generic message — do not reveal which field failed.
    return NextResponse.json({ error: AUTH_MESSAGES.invalidInput }, { status: 400 })
  }

  const email = sanitizeEmail(parsed.data.email)
  const { password } = parsed.data

  // Lockout check BEFORE hitting the auth provider. A locked account returns the
  // exact same generic message as a wrong password — the client can't tell them
  // apart.
  const lock = checkLogin(email)
  if (lock.locked) {
    await sleep(lock.delayMs)
    logger.error('[auth/login] blocked (locked) for', shortId(email))
    return NextResponse.json({ error: AUTH_MESSAGES.invalidCredentials }, { status: 401 })
  }

  const supabase = authClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    const { justLocked } = recordFailure(email)
    if (justLocked) {
      // Fire-and-forget: notify the user their account was locked, with a reset
      // link. Never block the response on email delivery.
      sendLockoutEmail(email).catch(() => {})
    }
    // Progressive delay grows with each consecutive failure (reads the updated
    // fail count via checkLogin).
    await sleep(checkLogin(email).delayMs)
    logger.error('[auth/login] failed sign-in for', shortId(email))
    // Same message whether the email is unknown, the password is wrong, or the
    // account just locked.
    return NextResponse.json({ error: AUTH_MESSAGES.invalidCredentials }, { status: 401 })
  }

  // Success: clear failure counters and hand the session back to the client,
  // which establishes the browser session via supabase.auth.setSession(...).
  recordSuccess(email)
  return NextResponse.json(
    {
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    },
    { status: 200 }
  )
}
