// UPI deep links, for paying a vendor by hand from a phone.
//
// The `upi://pay` scheme is the NPCI standard one and opens the phone's UPI
// app chooser. The app-specific schemes below jump straight into one app,
// which is friendlier when you already know which you use.
//
// Platform reality: these only do anything on a phone with the app installed.
// On desktop nothing happens, which is why the payout dialog also renders the
// same string as a QR code — scanning that from any UPI app is the desktop
// route. iOS support for the vendor-specific schemes is patchy; `upi://` is
// the dependable one.

export type UpiApp = 'any' | 'gpay' | 'phonepe' | 'paytm'

export const UPI_APPS: { id: UpiApp; label: string }[] = [
  { id: 'gpay', label: 'Google Pay' },
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'paytm', label: 'Paytm' },
  { id: 'any', label: 'Other UPI app' },
]

const SCHEMES: Record<UpiApp, string> = {
  any: 'upi://pay',
  gpay: 'tez://upi/pay',
  phonepe: 'phonepe://pay',
  paytm: 'paytmmp://pay',
}

export type UpiPaymentRequest = {
  /** Payee VPA, e.g. name@okaxis */
  vpa: string
  /** Payee display name shown in the UPI app */
  payeeName: string
  amount: number
  /** Short note shown on the transaction */
  note?: string
}

/**
 * Builds the deep link.
 *
 * Encoding is done by hand rather than with URLSearchParams, which serialises
 * as form-urlencoded and turns spaces into `+` — a payee name would reach the
 * UPI app as "Lit+Bites+Cafe". `%20` is what these apps expect.
 *
 * `@` is left as-is in the VPA: it is legal in a query string, and every UPI
 * link in the wild carries it raw, so escaping it to %40 only invites trouble
 * from apps that parse loosely.
 *
 * `am` is fixed to two decimals because some apps reject or silently drop a
 * malformed amount, landing the admin on a blank amount field — the exact
 * thing this is meant to avoid.
 */
function encodeParam(value: string, keepAt = false): string {
  const encoded = encodeURIComponent(value)
  return keepAt ? encoded.replace(/%40/g, '@') : encoded
}

export function buildUpiLink(req: UpiPaymentRequest, app: UpiApp = 'any'): string {
  const parts = [
    `pa=${encodeParam(req.vpa, true)}`,
    `pn=${encodeParam(req.payeeName)}`,
    `am=${req.amount.toFixed(2)}`,
    `cu=INR`,
  ]
  if (req.note) parts.push(`tn=${encodeParam(req.note.slice(0, 50))}`)
  return `${SCHEMES[app]}?${parts.join('&')}`
}

/** The standard string to encode as a QR — always the generic scheme. */
export function buildUpiQrPayload(req: UpiPaymentRequest): string {
  return buildUpiLink(req, 'any')
}
