// PII-scrubbing logger.
//
// Order IDs, payment IDs and customer name/email/phone were being logged in
// several places (razorpay helpers, webhook, sendSMS). Those land in Vercel logs
// where they are broadly readable. This wrapper redacts obvious PII and, in
// production, drops debug/info noise entirely — errors are always logged but with
// PII masked.

const IS_PROD = process.env.NODE_ENV === 'production'

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g
// 10-15 digit phone-like runs
const PHONE_RE = /(?:\+?\d[\s-]?){10,15}/g

function maskString(s: string): string {
  return s
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
}

function scrub(value: unknown): unknown {
  if (typeof value === 'string') return maskString(value)
  if (value instanceof Error) return maskString(value.message)
  if (Array.isArray(value)) return value.map(scrub)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Drop keys that are inherently PII regardless of value.
      if (/name|email|phone|contact|vpa|upi|address/i.test(k)) {
        out[k] = '[redacted]'
      } else {
        out[k] = scrub(v)
      }
    }
    return out
  }
  return value
}

export const logger = {
  debug(...args: unknown[]) {
    if (IS_PROD) return
    console.log(...args.map(scrub))
  },
  info(...args: unknown[]) {
    if (IS_PROD) return
    console.log(...args.map(scrub))
  },
  // Errors are always emitted (needed for observability) but scrubbed of PII.
  error(...args: unknown[]) {
    console.error(...args.map(scrub))
  },
}

// Short, non-PII identifier for correlating log lines with a support request.
export function shortId(id: string | null | undefined): string {
  if (!id) return 'unknown'
  return id.length <= 8 ? id : `${id.slice(0, 8)}…`
}
