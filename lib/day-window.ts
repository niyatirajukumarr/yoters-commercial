// India has no daylight saving, so a fixed +05:30 offset is safe.
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000

/**
 * Start of the current Indian calendar day, returned as an instant (UTC).
 *
 * `new Date().setHours(0, 0, 0, 0)` gives midnight in the *server's* timezone.
 * Vercel runs functions in UTC, so that is 05:30 IST — which means an order
 * placed at 1am IST drops out of "today" at 5:30 the same morning, and the
 * previous evening's orders keep counting as today until 5:30am. Business days
 * here are Indian calendar days, so the boundary has to be computed in IST.
 */
export function istDayStart(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS)
  shifted.setUTCHours(0, 0, 0, 0)
  return new Date(shifted.getTime() - IST_OFFSET_MS)
}

/**
 * Current hour-of-day in IST (0-23), for gating something like "opens at
 * 1pm" by clock time rather than by calendar day. Same fixed offset as
 * `istDayStart` — a customer's phone can be in any timezone, so this can't
 * be read off `Date.getHours()`.
 */
export function istHour(now: Date = new Date()): number {
  return new Date(now.getTime() + IST_OFFSET_MS).getUTCHours()
}
