// Account-lockout + progressive-delay guard for the login endpoint.
//
// Requirements implemented:
//  - Lock the account for 15 minutes after 5 consecutive failed attempts.
//  - Progressive delay: each failed attempt increases the server-side wait.
//  - Failed-attempt counts stored in an in-memory cache (swap for Redis/Upstash
//    in production — this is per-instance best-effort).
//  - On lockout, send a one-time email with a password-reset link.
//  - Callers must NEVER reveal lockout vs wrong-password to the client; this
//    module only signals "blocked" so the route can return one generic message.

import { logger, shortId } from './logger'

const MAX_FAILS = 5
const LOCK_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // reset counter after inactivity

interface Attempt {
  fails: number
  firstFailAt: number
  lockedUntil: number
  lockEmailSent: boolean
}

const attempts = new Map<string, Attempt>()

function key(email: string): string {
  return email.trim().toLowerCase()
}

// Progressive delay: 0, ~0.5s, 1s, 2s, 4s ... capped at 5s.
export function progressiveDelayMs(fails: number): number {
  if (fails <= 0) return 0
  return Math.min(5000, 250 * 2 ** fails)
}

export interface LockState {
  locked: boolean
  delayMs: number
}

// Called before verifying credentials. Returns whether the account is currently
// locked and how long to delay this response.
export function checkLogin(email: string): LockState {
  const k = key(email)
  const now = Date.now()
  const a = attempts.get(k)
  if (!a) return { locked: false, delayMs: 0 }

  // Expire stale counters.
  if (a.lockedUntil <= now && now - a.firstFailAt > ATTEMPT_WINDOW_MS) {
    attempts.delete(k)
    return { locked: false, delayMs: 0 }
  }

  if (a.lockedUntil > now) {
    return { locked: true, delayMs: progressiveDelayMs(a.fails) }
  }
  return { locked: false, delayMs: progressiveDelayMs(a.fails) }
}

// Record a failed attempt. Returns whether this failure just triggered a lockout
// (so the caller can fire the notification email exactly once).
export function recordFailure(email: string): { nowLocked: boolean; justLocked: boolean } {
  const k = key(email)
  const now = Date.now()
  const a = attempts.get(k) ?? { fails: 0, firstFailAt: now, lockedUntil: 0, lockEmailSent: false }
  a.fails += 1
  if (a.fails === 1) a.firstFailAt = now

  let justLocked = false
  if (a.fails >= MAX_FAILS && a.lockedUntil <= now) {
    a.lockedUntil = now + LOCK_MS
    justLocked = !a.lockEmailSent
    a.lockEmailSent = true
  }
  attempts.set(k, a)
  return { nowLocked: a.lockedUntil > now, justLocked }
}

// Clear all state after a successful login.
export function recordSuccess(email: string): void {
  attempts.delete(key(email))
}

// Send a one-time lockout notification email with a reset link. Best-effort;
// failures are logged, never surfaced to the client.
export async function sendLockoutEmail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (!apiKey || !from) {
    logger.error('[Lockout] Resend not configured; lockout email not sent')
    return
  }
  const resetLink = `${appUrl}/auth?mode=login&reset=1`
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to: email,
      subject: 'Security alert: unusual sign-in activity',
      text:
        `We noticed several failed sign-in attempts on your Yoters account.\n\n` +
        `For your security, sign-in has been temporarily paused. If this was you, ` +
        `you can reset your password here:\n${resetLink}\n\n` +
        `If it wasn't you, no action is needed — access will be restored automatically.`,
    })
    logger.debug('[Lockout] Notification email sent', { user: shortId(email) })
  } catch (err) {
    logger.error('[Lockout] Failed to send notification email:', err)
  }
}

export const LOCKOUT_CONFIG = { MAX_FAILS, LOCK_MS }
