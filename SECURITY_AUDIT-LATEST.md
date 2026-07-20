# Security Audit — Medium & Low Severity Findings (Latest)

- **Companion to:** `SECURITY_AUDIT.md` (Critical/High findings + launch verdict) and `SECURITY_RULES.md` (reusable rules + triggers).
- **Type:** Read-only / non-destructive static review + read-only public probes. No code modified.
- **Date:** 2026-07-18
- **Scope of this file:** The lower-severity issues that sit *below* the 6 Critical / 5 High launch-blockers. These are not individually launch-blocking, but several compound the Critical items and should be fixed before or shortly after launch.

---

## Medium Severity

### M1 — Order-tracking IDOR (compounds C3)
**Files:** `app/mobile/track/[orderId]/page.tsx:25-27`, `app/api/razorpay/create-order/route.ts:30`
Orders are looked up by `id` alone with no ownership check. Because RLS is `using (true)` (see C3 in main audit), anyone holding or guessing an order ID can read full order PII (name, phone, email, items, amount). UUIDs make guessing hard, but IDs leak via URLs, referrer headers, and shared links.
- **Fix:** Scope order reads by authenticated owner / owning vendor as part of the RLS rewrite.

### M2 — Verbose error leakage to client
**Files:** `app/api/razorpay/create-order/route.ts:85-100` (serializes the entire error object), plus `delete-order`, `deny-order`, `verify-payment`, `menu-popularity` (all return `error.message`); `app/auth/page.tsx:60` surfaces `authError.message` directly.
Leaks internal detail; the auth path can enable **user enumeration** (e.g. "user already registered").
- **Fix:** Return generic client messages; log full detail server-side only.

### M3 — Dead route file still leaking the live secret
**File:** `app/api/admin/initiate-payout.ts`
Not a valid App Router handler (must be `route.ts`), so it 404s and the admin payout button is broken — but the file still contains the live Razorpay secret (C1).
- **Fix:** Delete the file entirely; rebuild payout as a proper authenticated `route.ts` using env secrets.

### M4 — Refund marked successful prematurely
**File:** `app/api/vendor/deny-order/route.ts:76`
Sets `payment_status: 'refund_successful'` right after the Razorpay call is *accepted*, not when settlement is confirmed. A refund that later fails will still show as complete to the customer.
- **Fix:** Mark `refund_initiated` on accept; only mark successful on the `refund.processed` webhook.

### M5 — Placeholder / bogus contact data in payment flow
**File:** `app/payment/page.tsx`
Hardcodes `studentPhone: '9999999999'`; unauthenticated users get `student-${orderId}@yoters.local` as email. Razorpay records and notifications receive junk contact data → breaks refunds, receipts, and SMS delivery.
- **Fix:** Use the authenticated user's real, validated phone/email; reject orders without valid contact info.

### M6 — SMS notifications silently do nothing
**File:** `lib/notifications.ts:40-50`
`sendSMS` is a stub that only `console.log`s and returns `true`. Every "order approved/denied/ready" flow reports success while no SMS is sent. Twilio is a dependency but unused; the always-`true` return masks the failure.
- **Fix:** Implement Twilio send (server-side), and return real success/failure so callers can react.

---

## Low Severity

### L1 — Weak password policy
`app/auth/page.tsx:56` allows 6-character passwords with no complexity requirement.
- **Fix:** Enforce a stronger minimum (length + complexity) client- and server-side.

### L2 — No input format validation
Email/phone are checked only for presence, not format, on signup (`app/auth/page.tsx`) and in every API route (order creation accepts arbitrary `total_amount`, `phone`, etc.).
- **Fix:** Validate formats and numeric ranges server-side (e.g. zod) on all inputs.

### L3 — Middleware exempts all of `/api` + deprecated client
`app/middleware.ts:11` puts `/api` in the PUBLIC allowlist, so middleware never guards API routes (each must self-protect — and most don't, per C4). Also uses `@ts-ignore` + deprecated `@supabase/auth-helpers-nextjs` while the rest of the app uses `@supabase/ssr`.
- **Fix:** Remove the blanket `/api` exemption; standardize on `@supabase/ssr`; drop `@ts-ignore`.

### L4 — Hardcoded identity strings
Admin email `niyati.rajukumar@gmail.com` is hardcoded in `app/admin/page.tsx:38` and `app/middleware.ts:16`; manager notifications use literal `recipient_id: 'manager'` (`lib/notifications.ts:93`). Brittle; breaks on any personnel change.
- **Fix:** Model roles in the DB (a `role` column/table + claim); reference by role, not literal.

### L5 — `console.log` of sensitive data
Order IDs, payment IDs, and customer name/email/phone are logged in `lib/razorpay.ts:38,52`, the webhook route, and `sendSMS`. These land in Vercel logs.
- **Fix:** Scrub PII from logs; log identifiers only where necessary.

### L6 — Overly broad image host
`next.config.ts` `images.remotePatterns: { hostname: '**' }` lets the Next image optimizer proxy any HTTPS URL (minor SSRF/abuse + bandwidth-cost surface).
- **Fix:** Restrict `remotePatterns` to known hosts (Supabase storage, approved CDNs).

### L7 — `access-control-allow-origin: *`
Present on the live deployment (observed in response headers). Low impact for GET HTML, but should be scoped once APIs are auth-gated.
- **Fix:** Scope CORS to the app origin for API responses.

### L8 — Stray / committed files & schema ambiguity
`env.download` (Supabase URL + anon key) and `.hintrc` are committed. Multiple schema variants (`schema.sql`, `schema_v2.sql`, `schema_commercial.sql`) create ambiguity about which policy set is actually live.
- **Fix:** Remove committed env files; consolidate to a single authoritative schema/migrations source.

---

## Note (informational, not a finding)
The `scripts/*.js` seed utilities read secrets from `process.env` — **no hardcoded secrets** there (good). One minor coupling: `scripts/create-image-column.js:54` hardcodes the project URL `https://qbvwcpjjattwebdzexni.supabase.co` (not a secret, but ties the script to one project).

---
*Severity model: Medium = meaningful risk or reliability bug, not directly exploitable for money/data loss on its own; Low = hardening / hygiene. Critical & High are in `SECURITY_AUDIT.md`.*
