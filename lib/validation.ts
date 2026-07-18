// Lightweight, dependency-free input validation shared by the API routes and
// the auth UI. Covers the format/range checks that were previously missing
// (email/phone presence-only checks, unbounded numeric amounts, weak passwords).
//
// Kept as plain TypeScript (no zod dependency) so it runs identically on the
// client (auth page) and server (API routes) without adding install surface.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Indian mobile numbers: optional +91 / 0 prefix, then a 10-digit number
// starting 6-9. Also accepts a bare 10-15 digit E.164-ish number.
const PHONE_RE = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/
const E164_RE = /^\+?[1-9]\d{7,14}$/

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email.trim())
}

export function isValidPhone(phone: unknown): phone is string {
  if (typeof phone !== 'string') return false
  const p = phone.replace(/[\s-]/g, '')
  return PHONE_RE.test(p) || E164_RE.test(p)
}

// Normalise an Indian phone number to E.164 (+91XXXXXXXXXX) for Twilio / storage.
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  const ten = digits.slice(-10)
  return `+91${ten}`
}

export interface AmountOpts {
  min?: number
  max?: number
}

// Validates a monetary amount (in INR rupees). Rejects NaN, negatives, and
// absurd values that indicate tampering.
export function isValidAmount(
  amount: unknown,
  { min = 1, max = 100000 }: AmountOpts = {}
): amount is number {
  const n = typeof amount === 'string' ? Number(amount) : amount
  return (
    typeof n === 'number' &&
    Number.isFinite(n) &&
    n >= min &&
    n <= max
  )
}

export function isNonEmptyString(v: unknown, maxLen = 500): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen
}

// Basic UPI VPA format: handle@provider
export function isValidUpiId(vpa: unknown): vpa is string {
  return typeof vpa === 'string' && /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa.trim())
}

export interface PasswordResult {
  ok: boolean
  message?: string
}

// Strong password policy enforced on both client and server.
// Minimum 8 chars with at least one letter and one number.
export function validatePassword(password: unknown): PasswordResult {
  if (typeof password !== 'string') {
    return { ok: false, message: 'Password is required.' }
  }
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }
  if (password.length > 72) {
    // bcrypt/Supabase practical limit
    return { ok: false, message: 'Password must be at most 72 characters.' }
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, message: 'Password must include at least one letter and one number.' }
  }
  return { ok: true }
}
