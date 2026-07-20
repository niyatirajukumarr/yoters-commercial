// Centralised identity / role configuration.
//
// Roles were previously hardcoded as literal email strings scattered across the
// app (admin dashboard, middleware, manager page) and a literal `recipient_id:
// 'manager'`. That is brittle — any personnel change silently breaks access.
//
// Roles are now driven by environment variables so they can be rotated without a
// code change, and there is a single `isAdmin` / `isManager` helper used
// everywhere. The `role` column on `profiles` (see the security-hardening
// migration) is the authoritative source in the database; these env lists are
// the deploy-time allowlist the app trusts for privileged UI/route gating.

function parseEmails(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

// NEXT_PUBLIC_* is required because admin/manager gating also happens in client
// components. Falls back to the historical owner address so existing deploys
// keep working until the env var is set.
const ADMIN_EMAILS = parseEmails(
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS
)
const MANAGER_EMAILS = parseEmails(
  process.env.NEXT_PUBLIC_MANAGER_EMAILS ||
    process.env.MANAGER_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS
)

// Historical fallback so a deploy without the new env vars does not lock the
// owner out. Set NEXT_PUBLIC_ADMIN_EMAILS in production to override.
const FALLBACK_OWNER = 'niyati.rajukumar@gmail.com'

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.toLowerCase()
  if (ADMIN_EMAILS.length === 0) return e === FALLBACK_OWNER
  return ADMIN_EMAILS.includes(e)
}

export function isManager(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.toLowerCase()
  if (MANAGER_EMAILS.length === 0) return e === FALLBACK_OWNER
  return MANAGER_EMAILS.includes(e)
}

// Logical recipient id used for manager-targeted notifications. Kept as a stable
// role token so notification rows are not tied to one person's address.
export const MANAGER_RECIPIENT_ID = 'manager'

// ---------- DPDP (Digital Personal Data Protection Act, 2023) config ----------
//
// The consent version is bumped whenever the privacy notice materially changes,
// so we can detect users who consented to an older version and re-prompt.
export const CONSENT_VERSION = '2026-07-21'

// Grievance Officer / Data Protection contact published in the privacy notice
// (DPDP s.13 requires a reachable grievance-redressal contact). Set the real
// details via env in production; the fallbacks are placeholders, NOT valid.
export const GRIEVANCE_OFFICER = {
  name: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || 'Grievance Officer',
  email: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL || 'privacy@yoters.example',
  // Data-retention window for order/PII after which records are eligible for
  // erasure (purpose limitation / storage limitation).
  retentionDays: 365,
}
