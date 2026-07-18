// Input sanitization helpers for auth/user-supplied text.
//
// Strips HTML/script tags and control characters so stored/echoed values can't
// carry markup or injection payloads. Applied server-side after Zod validation.

// Remove anything that looks like an HTML/script tag, plus angle brackets.
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/[<>]/g, '')
}

// Remove ASCII control characters (0x00-0x1F and 0x7F) that can be used for log
// injection or terminal escapes. Hex escapes keep the source pure-ASCII.
export function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1F\x7F]/g, '')
}

// General-purpose sanitizer for free-text fields (name, display name).
export function sanitizeText(input: string): string {
  return stripControlChars(stripHtml(input)).trim()
}

// Emails: lowercase, trim, strip control chars. (Format is validated by Zod.)
export function sanitizeEmail(input: string): string {
  return stripControlChars(input).trim().toLowerCase()
}

// Phone: keep only digits and a leading +.
export function sanitizePhone(input: string): string {
  const trimmed = input.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/[^\d]/g, '')
}
