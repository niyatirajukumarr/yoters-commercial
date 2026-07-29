# Security Audit — Medium & Low Severity Findings (Latest)

- **Companion to:** `SECURITY_AUDIT.md` (Critical/High findings + launch verdict) and `SECURITY_RULES.md` (reusable rules + triggers).
- **Type:** Read-only / non-destructive static review + read-only public probes. No code modified.
- **Date:** 2026-07-18 (original), re-audited 2026-07-30 (see top section).
- **Scope of this file:** The lower-severity issues that sit *below* the 6 Critical / 5 High launch-blockers. These are not individually launch-blocking, but several compound the Critical items and should be fixed before or shortly after launch.

---

## 2026-07-30 Re-Audit — what changed since 07-18

A follow-up pass re-verified every Critical/High item from `SECURITY_AUDIT.md` against the current code, and re-ran the standing checks (secret scan, RLS grep, dependency audit, header/CORS check). Most Critical/High findings were confirmed **fixed**:

- C1 (live secret), C2 (unauthenticated `confirm-payment`), C5 (`seed-demo-item`): routes/secrets removed entirely.
- C3 (orders `using(true)`), C6 (client-trusted amount): `orders` RLS is owner/vendor-scoped; `create-order`/`verify-payment` trust the DB row.
- C4 (unauthenticated API routes): every route now goes through `lib/auth-server.ts` (`requireVendorForOrder`/`requireVendorForCafeteria`/`requireAdmin`) — identity from a verified session token, never the request body.
- H1–H5 (rate limiting, security headers, webhook timing-safety, hardcoded admin email, CORS/image host): all confirmed fixed (`lib/rate-limit.ts`, `next.config.ts` header/CORS/image config, `crypto.timingSafeEqual` in `lib/razorpay.ts`, `lib/config.ts` env-driven roles).

But the RLS remediation from 07-18 only ever touched `orders` and `payouts`. This pass found it left several other tables on their **original, unscoped** policies from `schema_commercial.sql` — effectively new Critical/High findings:

### NEW-C1 — `cafeterias`, `cafeteria_menu`, `cafeteria_queues`, `token_sequences` still `for all using (true)` 🔴
Never touched by any migration since the original schema. The public anon key could write:
- `cafeterias.vendor_email`/`upi_id` — the sole ownership check used by vendor login and every vendor-scoped route, and the payout destination → full vendor account takeover / payout redirection.
- `cafeteria_menu.price` — `orders.total_amount` is computed client-side from this price and then trusted as the "authoritative" DB row by `create-order`/`verify-payment`, so a forged menu price is a forged payment (this quietly defeats the C6 fix).
- `token_sequences`/`cafeteria_queues` — token/queue tampering.
- **Fix:** `supabase/migrations/20260730_close_open_rls_gaps.sql` scopes all four to the owning vendor (or manager/admin). `cafeteria_menu` updates stay open at the RLS layer (a guest checkout's stock decrement needs it) but a new `protect_menu_item_writes()` trigger silently discards any non-owner change to price/name/etc., only allowing `stock_quantity` to move downward. `update_cafeteria_queue()` and `generate_token_number()` were made `SECURITY DEFINER` so they keep working when fired by a customer's order write.

### NEW-H1 — `notifications` world-readable/writable 🟠
`add_cashfree_and_approval_flow.sql` left `using(true)`/`with check(true)` on select/insert/update, never addressed by the hardening pass. `recipient_id` carries student phone numbers tied to order/payment messages.
- **Fix:** `lib/notifications.ts` switched from the anon browser client to a service-role client (it only ever runs server-side); the migration then drops all anon/authenticated policies, matching the `payouts` pattern.

### NEW-H2 — `manager_audit_log` lockdown never actually applied (name-mismatch bug) 🟠
`20260718_security_hardening.sql` tried to `drop policy if exists "Public read audit"` / `"Manage audit"` — but the real policies (from `add_cashfree_and_approval_flow.sql`) are named `"Public read audit log"` / `"Create audit log"`. `DROP POLICY IF EXISTS` silently no-ops on a name mismatch, so the audit log stayed world-readable/writable the whole time.
- **Fix:** same migration drops the policies under their real names.

### NEW-H3 — `next@16.2.2` had ~20 known CVEs, several high-severity 🟠
Including SSRF, DoS, and middleware/proxy-bypass advisories, all patched in `16.2.12` (a non-major bump).
- **Fix:** `package.json` bumped `next`→16.2.12, `eslint-config-next`→16.2.12 (match), `resend`→6.18.1 (fixes a moderate `svix` advisory). `npm test` (41/41) and `npm run build` both pass clean on the new versions.

**Status:** All code-side fixes (migration file, `lib/notifications.ts`, `package.json`) are committed to the repo. **The migration still needs to be run against the live Supabase project** (SQL editor or `supabase db push`) — it is not yet confirmed applied. Re-run the secret scan / RLS grep / header probe / `npm audit` once it is, per `SECURITY_RULES.md`.

---

## Medium Severity

### M1 — Order-tracking IDOR (compounds C3) — ✅ FIXED (verified 2026-07-30)
**Files:** `app/mobile/track/[orderId]/page.tsx:25-27`, `app/api/razorpay/create-order/route.ts:30`
Orders are looked up by `id` alone with no ownership check. Because RLS is `using (true)` (see C3 in main audit), anyone holding or guessing an order ID can read full order PII (name, phone, email, items, amount). UUIDs make guessing hard, but IDs leak via URLs, referrer headers, and shared links.
- **Fix:** Scope order reads by authenticated owner / owning vendor as part of the RLS rewrite. — Confirmed live: `orders` SELECT policy is scoped to `student_phone`/`student_email` match or owning-vendor/manager/admin (`20260718_security_hardening.sql`).

### M2 — Verbose error leakage to client — ⚠️ PARTIALLY FIXED (re-check `app/auth/page.tsx`)
**Files:** `app/api/razorpay/create-order/route.ts:85-100` (serializes the entire error object), plus `delete-order`, `deny-order`, `verify-payment`, `menu-popularity` (all return `error.message`); `app/auth/page.tsx:60` surfaces `authError.message` directly.
Leaks internal detail; the auth path can enable **user enumeration** (e.g. "user already registered").
- **Fix:** Return generic client messages; log full detail server-side only. — Confirmed fixed in `create-order` and `verify-payment` (both now return generic messages, log detail via `logger.error`). `app/auth/page.tsx` enumeration behavior was **not re-tested** in the 07-30 pass — re-verify before considering this closed.

### M3 — Dead route file still leaking the live secret — ✅ FIXED (verified 2026-07-30)
**File:** `app/api/admin/initiate-payout.ts`
Not a valid App Router handler (must be `route.ts`), so it 404s and the admin payout button is broken — but the file still contains the live Razorpay secret (C1).
- **Fix:** Delete the file entirely; rebuild payout as a proper authenticated `route.ts` using env secrets. — Confirmed: `app/api/admin/initiate-payout/route.ts` is now a proper handler, admin-authenticated, all Razorpay credentials read from env, server-computed balance, idempotency key, no hardcoded secrets.

### M4 — Refund marked successful prematurely — ✅ FIXED (verified 2026-07-30)
**File:** `app/api/vendor/deny-order/route.ts:76`
Sets `payment_status: 'refund_successful'` right after the Razorpay call is *accepted*, not when settlement is confirmed. A refund that later fails will still show as complete to the customer.
- **Fix:** Mark `refund_initiated` on accept; only mark successful on the `refund.processed` webhook. — Confirmed: `app/api/razorpay/webhook/route.ts` now handles `refund.processed`/`refund.failed` and only promotes to `refund_successful` on confirmed settlement.

### M5 — Placeholder / bogus contact data in payment flow — ❓ NOT RE-VERIFIED
**File:** `app/payment/page.tsx`
Hardcodes `studentPhone: '9999999999'`; unauthenticated users get `student-${orderId}@yoters.local` as email. Razorpay records and notifications receive junk contact data → breaks refunds, receipts, and SMS delivery.
- **Fix:** Use the authenticated user's real, validated phone/email; reject orders without valid contact info. — Not checked in the 2026-07-30 pass; status unknown.

### M6 — SMS notifications silently do nothing — ✅ FIXED (verified 2026-07-30)
**File:** `lib/notifications.ts:40-50`
`sendSMS` is a stub that only `console.log`s and returns `true`. Every "order approved/denied/ready" flow reports success while no SMS is sent. Twilio is a dependency but unused; the always-`true` return masks the failure.
- **Fix:** Implement Twilio send (server-side), and return real success/failure so callers can react. — Confirmed: real Twilio `client.messages.create` call, returns actual success/failure, logs only the message SID (not PII).

---

## Low Severity

### L1 — Weak password policy — ❓ NOT RE-VERIFIED
`app/auth/page.tsx:56` allows 6-character passwords with no complexity requirement.
- **Fix:** Enforce a stronger minimum (length + complexity) client- and server-side.

### L2 — No input format validation — ✅ FIXED for routes checked (verified 2026-07-30)
Email/phone are checked only for presence, not format, on signup (`app/auth/page.tsx`) and in every API route (order creation accepts arbitrary `total_amount`, `phone`, etc.).
- **Fix:** Validate formats and numeric ranges server-side (e.g. zod) on all inputs. — Confirmed: `lib/validation.ts` (`isValidEmail`/`isValidPhone`/`isValidAmount`/`isNonEmptyString`) is used in `create-order`, `initiate-payout`, `record-payout`. Signup page (`app/auth/page.tsx`) not re-checked.

### L3 — Middleware exempts all of `/api` + deprecated client — ⚠️ FILE RENAMED, NOT RE-VERIFIED
`app/middleware.ts:11` puts `/api` in the PUBLIC allowlist, so middleware never guards API routes (each must self-protect — and most don't, per C4). Also uses `@ts-ignore` + deprecated `@supabase/auth-helpers-nextjs` while the rest of the app uses `@supabase/ssr`.
- **Fix:** Remove the blanket `/api` exemption; standardize on `@supabase/ssr`; drop `@ts-ignore`. — `app/middleware.ts` no longer exists; there is now a root-level `proxy.ts` (Next.js 16 renamed Middleware to Proxy — see `AGENTS.md`'s breaking-changes warning). Since every `/api` route now self-authenticates (C4 is fixed), the original risk is largely moot, but the `/api` exemption behavior in `proxy.ts` itself was not re-audited this pass.

### L4 — Hardcoded identity strings — ✅ FIXED (verified 2026-07-30)
Admin email `niyati.rajukumar@gmail.com` is hardcoded in `app/admin/page.tsx:38` and `app/middleware.ts:16`; manager notifications use literal `recipient_id: 'manager'` (`lib/notifications.ts:93`). Brittle; breaks on any personnel change.
- **Fix:** Model roles in the DB (a `role` column/table + claim); reference by role, not literal. — Confirmed: `lib/config.ts` now drives `isAdmin`/`isManager` off `NEXT_PUBLIC_ADMIN_EMAILS`/`NEXT_PUBLIC_MANAGER_EMAILS` env allowlists, with a DB `profiles.role` column as the authoritative server-side source (`20260718_security_hardening.sql`) protected against self-escalation (`20260722_protect_profile_role.sql`). The hardcoded email remains only as an emergency fallback if the env var is unset.

### L5 — `console.log` of sensitive data — ✅ FIXED for files checked (verified 2026-07-30)
Order IDs, payment IDs, and customer name/email/phone are logged in `lib/razorpay.ts:38,52`, the webhook route, and `sendSMS`. These land in Vercel logs.
- **Fix:** Scrub PII from logs; log identifiers only where necessary. — Confirmed: `lib/razorpay.ts`, the webhook route, and `sendSMS` now log via `shortId()`/message SID only, not full identifiers or PII.

### L6 — Overly broad image host — ✅ FIXED (verified 2026-07-30)
`next.config.ts` `images.remotePatterns: { hostname: '**' }` lets the Next image optimizer proxy any HTTPS URL (minor SSRF/abuse + bandwidth-cost surface).
- **Fix:** Restrict `remotePatterns` to known hosts (Supabase storage, approved CDNs). — Confirmed: scoped to `*.supabase.co`/`*.supabase.in` + the configured Supabase host only.

### L7 — `access-control-allow-origin: *` — ✅ FIXED (verified 2026-07-30)
Present on the live deployment (observed in response headers). Low impact for GET HTML, but should be scoped once APIs are auth-gated.
- **Fix:** Scope CORS to the app origin for API responses. — Confirmed: `next.config.ts` scopes `/api/*` CORS headers to `NEXT_PUBLIC_APP_URL` when set.

### L8 — Stray / committed files & schema ambiguity — ✅ PARTIALLY FIXED (verified 2026-07-30)
`env.download` (Supabase URL + anon key) and `.hintrc` are committed. Multiple schema variants (`schema.sql`, `schema_v2.sql`, `schema_commercial.sql`) create ambiguity about which policy set is actually live.
- **Fix:** Remove committed env files; consolidate to a single authoritative schema/migrations source. — Confirmed: `env.download` is gone and explicitly blocked in `.gitignore` ("committed env dump (removed) — never re-add"). Only `schema_commercial.sql` remains as the base schema, with `supabase/migrations/*.sql` as the source of truth for everything since — no more `schema_v2.sql`/duplicate variants found.

---

## Note (informational, not a finding)
The `scripts/*.js` seed utilities read secrets from `process.env` — **no hardcoded secrets** there (good). One minor coupling: `scripts/create-image-column.js:54` hardcodes the project URL `https://qbvwcpjjattwebdzexni.supabase.co` (not a secret, but ties the script to one project).

---
*Severity model: Medium = meaningful risk or reliability bug, not directly exploitable for money/data loss on its own; Low = hardening / hygiene. Critical & High are in `SECURITY_AUDIT.md`.*
