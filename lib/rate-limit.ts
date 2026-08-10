// Lightweight in-memory fixed-window rate limiter (R14).
//
// This is a best-effort, per-instance limiter: on serverless it protects each
// warm instance and blunts bursts, but is not a global limiter. For production
// use it alongside the Vercel WAF / a shared store (Upstash Redis) — this module
// is the app-level backstop, not the whole answer.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodically evict expired buckets so the map doesn't grow unbounded.
let lastSweep = 0
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
  retryAfterSec: number
}

/**
 * Consume one unit against `key`. Allows `limit` requests per `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt, retryAfterSec: 0 }
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSec: 0,
  }
}

// Derive a client identifier from proxy headers (Vercel sets x-forwarded-for).
export function clientKey(req: Request, scope: string): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
  return `${scope}:${ip}`
}

function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  )
}

// Convenience: enforce a limit and return a ready-made 429 Response if exceeded,
// or null to proceed.
export function enforceRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number
): Response | null {
  const result = rateLimit(clientKey(req, scope), limit, windowMs)
  return result.ok ? null : tooManyRequests(result.retryAfterSec)
}

/**
 * Two-tier limit for endpoints where many people legitimately share one IP.
 *
 * A campus or office puts hundreds of customers behind a single NAT address,
 * so an IP-only limit means one person's allowance is the whole building's:
 * at lunch the sixteenth student to check out gets a 429 and cannot pay. The
 * strict bucket is therefore keyed on `identity` — something that identifies
 * the one checkout, like the order id — and the IP bucket is kept only as a
 * loose backstop against a single host hammering the endpoint.
 *
 * `identity` must be server-verifiable. An order id qualifies: the route
 * looks it up and 404s if it does not exist, so it cannot be invented freely.
 */
export function enforceSharedNetworkRateLimit(
  req: Request,
  scope: string,
  identity: string | null | undefined,
  opts: { perIdentity: number; perIp: number; windowMs?: number }
): Response | null {
  const windowMs = opts.windowMs ?? 60_000

  // No identity (malformed body) — fall back to the IP bucket alone so the
  // endpoint is never left unprotected.
  if (identity) {
    const byIdentity = rateLimit(`${scope}:id:${identity}`, opts.perIdentity, windowMs)
    if (!byIdentity.ok) return tooManyRequests(byIdentity.retryAfterSec)
  }

  const byIp = rateLimit(clientKey(req, scope), opts.perIp, windowMs)
  return byIp.ok ? null : tooManyRequests(byIp.retryAfterSec)
}
