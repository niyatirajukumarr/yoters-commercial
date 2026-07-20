// Zod schemas + shared error contract for server-side auth validation.
//
// Every auth field is validated for format AND length on the server, regardless
// of any client-side checks. On failure the API returns a single generic message
// (never "which field failed") so we don't hand attackers a field-probing oracle.

import { z } from 'zod'

// Kept in sync with lib/validation.ts (client-side) but authoritative here.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/

// Generic messages — the ONLY auth-facing strings the client should show.
export const AUTH_MESSAGES = {
  invalidInput: 'Please check your details and try again.',
  invalidCredentials: 'Incorrect email or password',
  signupFailed: 'Could not create your account. Please check your details and try again.',
  resetSent: "If that email is registered, you'll receive a reset link",
  rateLimited: 'Too many attempts. Please try again later.',
} as const

export const loginSchema = z.object({
  email: z.string().trim().min(3).max(254).regex(EMAIL_RE),
  password: z.string().min(1).max(72),
})

export const signupSchema = z.object({
  email: z.string().trim().min(3).max(254).regex(EMAIL_RE),
  // Password policy: 8-72 chars, at least one letter and one number.
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
  // Display name / username: printable, bounded length.
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(PHONE_RE),
  // DPDP s.6: consent must be free, specific, informed and unambiguous. The
  // client must send an explicit `true` — a missing/false value is rejected so
  // an account can never be created without recorded consent.
  consent: z.literal(true),
  consentVersion: z.string().trim().min(1).max(40),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
