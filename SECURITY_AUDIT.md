# Security & Launch-Readiness Audit — yoters-commercial (queue-app)

- **Scope:** Full repository static review + read-only public header/endpoint probe of `https://yoters-commercial.vercel.app`.
- **Type:** Read-only / non-destructive. No code was modified. No payloads that create, mutate, or delete data were sent — only `GET` probes and one header `HEAD`-style request.
- **Date:** 2026-07-18
- **Stack:** Next.js 16.2.2 (App Router), React 19, Supabase, Razorpay, Twilio, Resend, deployed on Vercel.

---

## 1. Final Verdict

| Metric | Rating |
|---|---|
| **Overall Security Rating** | **F — Critical (2.5 / 10)** |
| **Launch Readiness** | ❌ **NOT READY — do not launch** |
| **Blocking issues** | 6 Critical, 5 High |

The application currently allows **payment-status forgery, unauthenticated privileged data access, and open database access**, and ships **live payment credentials committed in source**. Any of the Critical items alone is a launch blocker. This is a straightforward money-loss / data-breach risk in its current state.

---

## 2. Critical Findings (must fix before launch)

### C1 — Live Razorpay secret key committed in source code 🔴
**File:** `app/api/admin/initiate-payout.ts:3-5`
```ts
const RAZORPAY_KEY_ID = 'rzp_live_[REDACTED]'
const RAZORPAY_KEY_SECRET = '[REDACTED — LIVE SECRET, ROTATE]'
const RAZORPAY_ACCOUNT_ID = '[REDACTED]'
```
> Note: the actual leaked values have been redacted from this document. The key
> must be rotated in the Razorpay dashboard and treated as compromised.
Also duplicated in `SETUP_PAYOUTS.md:30`. A **live** Razorpay key secret grants full control over payouts, refunds, and payments on the merchant account. Anyone with repo access (or if the repo ever becomes public / leaks) can drain funds.
- **Impact:** Total compromise of the payment account.
- **Fix:** **Rotate/revoke this key in the Razorpay dashboard immediately** — treat it as already compromised. Move to `process.env.RAZORPAY_KEY_SECRET`. Purge from git history (`git filter-repo` / BFG). Never commit secrets; the file `env.download` (containing the Supabase URL + anon key) should also not be committed.

### C2 — Unauthenticated payment confirmation (payment forgery) 🔴
**File:** `app/api/confirm-payment/route.ts` — confirmed **live** (probe returned `405` for GET, i.e. route exists, POST-only, no auth).
```ts
export async function POST(req) {
  const { orderId, razorpayPaymentId } = await req.json()
  // ...no signature check, no auth...
  await adminSupabase.from('orders').update({ payment_status: 'paid', status: 'paid' }).eq('id', orderId)
}
```
Any anonymous user can POST `{ "orderId": "<any id>" }` and mark an order **paid** without paying. Uses the service-role client, bypassing all DB policy.
- **Impact:** Free orders / direct revenue loss. This endpoint has **no legitimate caller in the codebase** (orphaned) yet is publicly reachable.
- **Fix:** Delete the route, or require a verified Razorpay signature (as `verify-payment` already does) plus server-side amount check.

### C3 — Supabase RLS policies are effectively disabled (`using (true)`) 🔴
**File:** `supabase/schema_commercial.sql:148-174` (and `schema_v2.sql`).
```sql
create policy "Public read orders"  on orders for select using (true);
create policy "Update orders"        on orders for update using (true);
create policy "Manage payouts"       on payouts for all   using (true);
create policy "Vendor manage cafeterias" on cafeterias for all using (true);
```
RLS is *enabled* but every policy evaluates to `true`, so the **anon key** (which is public — see `env.download`, and shipped to every browser) can **read and modify every table**: all orders (PII: names, phones, emails), payouts, cafeterias, notifications.
- **Impact:** Full database read/write for anyone on the internet with the anon key. Mass PII breach + order/payout tampering.
- **Fix:** Rewrite policies to scope by `auth.uid()` / ownership. Orders should be readable only by their owner and the owning vendor; `update`/`all` policies must never be `using (true)`. Payouts/audit tables should be service-role-only (no anon policy).

### C4 — Privileged API routes have no authentication or authorization 🔴
Every route below instantiates a **service-role** Supabase client and performs no caller auth:
- `app/api/vendor/orders/route.ts` — returns **all paid orders** (customer name/phone/email/items) for any `cafeteriaId`. Confirmed live (`400` only on missing param, never `401`).
- `app/api/vendor/approve-order/route.ts` — approves any order; trusts `vendorEmail` from the body with **no ownership check**.
- `app/api/confirm-payment`, `app/api/seed-demo-item`, `app/api/menu-popularity` — all service-role, all unauthenticated (probes: `405`, `500`, `400` — all reachable).

`deny-order` is the only one that verifies vendor ownership (`.eq('vendor_email', vendorEmail)`), and even that trusts an unauthenticated body field.
- **Impact:** Anyone can enumerate customer PII per cafeteria, approve/deny arbitrary orders, and seed data.
- **Fix:** Authenticate every route via the Supabase session cookie (`getUser()`), then authorize the caller against the resource. Never derive identity from a request-body field.

### C5 — `seed-demo-item` is a public, service-role write endpoint 🔴
**File:** `app/api/seed-demo-item/route.ts` — `GET` inserts a menu row using the service-role key, no auth. Confirmed reachable (`500`).
- **Impact:** Anonymous DB write / data pollution; a trivial write-amplification / spam vector (no rate limit).
- **Fix:** Remove from production entirely (dev-only seeding belongs in `scripts/`).

### C6 — Server trusts client-supplied payment amount 🔴
**Files:** `app/payment/page.tsx:82` sends `amount: parseInt(amount)` from the URL/client; `app/api/razorpay/create-order/route.ts` uses that `amount` directly to create the Razorpay order **without re-reading `orders.total_amount` from the DB**. Order creation itself (`app/mobile/order/[cafeteriaId]/page.tsx:518`) also inserts a client-computed `total_amount`.
- **Impact:** A user can pay ₹1 for a ₹1000 order by tampering with the amount.
- **Fix:** The server must compute/verify the payable amount from trusted DB rows (menu price × qty), ignoring any client-sent amount.

---

## 3. High Findings

### H1 — No rate limiting anywhere 🟠
No rate limiting, throttling, or WAF rule was found in code (`grep` for rate-limit/upstash/429/throttle → none) and Vercel's WAF is not configured. Combined with C2–C5, unauthenticated endpoints (payment confirm, order enumeration, seed, OTP/SMS via Twilio, email via Resend) can be hammered → billing abuse (SMS/email cost), data scraping, and DoS.
- **Fix:** Add Vercel WAF rate-limit rules and/or an app-level limiter (e.g. Upstash Ratelimit) on all `/api/*`, especially auth, payment, and notification routes.

### H2 — Missing security response headers 🟠
Live headers on `/` include only `Strict-Transport-Security` and `x-dns-prefetch-control`. **Absent:** `Content-Security-Policy`, `X-Frame-Options` (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. `next.config.ts` sets only `X-DNS-Prefetch-Control`.
- **Fix:** Add the full header set in `next.config.ts` `headers()` (see companion `SECURITY_RULES.md`).

### H3 — Weak webhook signature comparison (timing) 🟠
**File:** `lib/razorpay.ts:108` — `verifyWebhookSignature` uses `signature === expectedSignature` (non-constant-time). The payment-signature path (`:80`) correctly uses `crypto.timingSafeEqual`; the webhook path does not.
- **Fix:** Use `crypto.timingSafeEqual` for the webhook comparison too.

### H4 — Authorization gate is client-side only + hardcoded admin email 🟠
**Files:** `app/admin/page.tsx:38` and `app/manager` gate on `session.user.email === 'niyati.rajukumar@gmail.com'` in the browser. `app/middleware.ts:16` repeats this for `/manager`, but the **admin data fetch runs client-side against Supabase**, so RLS (C3, currently `true`) is the only real control — meaning none. Hardcoding an identity in source is also brittle.
- **Fix:** Enforce admin/manager role server-side (RLS + a `role` claim/table), not by client email string.

### H5 — Overly permissive config (CORS + image host + `@ts-ignore`) 🟠
- Live `/` returns `access-control-allow-origin: *`.
- `next.config.ts` allows images from **any** HTTPS host (`hostname: '**'`) → SSRF/abuse surface for the image optimizer.
- `app/middleware.ts:1` uses `@ts-ignore` and the deprecated `@supabase/auth-helpers-nextjs` (project uses `@supabase/ssr` elsewhere) — inconsistent, and `/api` is entirely in the `PUBLIC` allowlist so middleware never protects API routes.
- **Fix:** Scope CORS to the app origin, restrict image `remotePatterns` to known hosts, standardize on `@supabase/ssr`, and don't blanket-exempt `/api`.

---

## 4. Medium / Housekeeping

- **M1 — Verbose error leakage:** Many routes return `error.message` / full serialized errors to the client (`create-order/route.ts:85-100`, others). Leaks internal detail. Return generic messages; log detail server-side.
- **M2 — Dead/misplaced route file:** `app/api/admin/initiate-payout.ts` is **not** a valid App Router handler (must be `route.ts`); probe confirmed `404`. So the admin payout button (`admin/page.tsx:180`) is **broken**, yet the file still leaks live secrets (C1). Remove the file.
- **M3 — Hardcoded placeholder phone:** `app/payment/page.tsx` sends `studentPhone: '9999999999'` — payment/notification records get bogus contact data.
- **M4 — Refund marked "successful" before confirmation:** `deny-order/route.ts:76` sets `refund_successful` as soon as the API call is accepted, not when Razorpay confirms settlement.
- **M5 — `.hintrc` / demo endpoints / seed scripts** present in the repo; ensure none reach production and that `scripts/*` never embed service-role keys.

---

## 5. What Was Tested (E2E / probes)

Read-only `GET` probes against the live deployment (non-destructive; no data written):

| Path | Result | Meaning |
|---|---|---|
| `/` | 200, HSTS only | Missing CSP/X-Frame/nosniff/Referrer/Permissions |
| `/api/vendor/orders` | 400 (missing param, never 401) | No auth gate |
| `/api/confirm-payment` | 405 (POST-only, live) | Unauthenticated payment-forgery route is deployed |
| `/api/seed-demo-item` | 500 (reachable) | Public service-role write route |
| `/api/menu-popularity` | 400 (reachable) | Public service-role read route |
| `/api/admin/initiate-payout` | 404 | Not a valid route (wrong filename) — feature broken |

Static analysis covered: all 11 API routes, `lib/razorpay.ts`, `lib/supabase.ts`, `lib/notifications.ts`, `app/middleware.ts`, admin/manager pages, order/payment flows, and all `supabase/*.sql` RLS policies.

---

## 6. Launch-Readiness Checklist (blocking → nice-to-have)

**Blocking (must all be done):**
1. Rotate the leaked Razorpay live key (C1); purge from source + git history; move all secrets to env.
2. Delete or authenticate + signature-verify `confirm-payment` (C2).
3. Rewrite all RLS policies to scope by ownership; remove every `using (true)` (C3).
4. Add server-side auth + authz to every `/api` route; stop trusting body-supplied identity (C4).
5. Remove `seed-demo-item` from production (C5).
6. Compute/verify payment amounts server-side from the DB (C6).

**Before launch (High):**
7. Add rate limiting / WAF on all APIs (H1).
8. Add the full security-header set (H2).
9. Constant-time webhook signature check (H3).
10. Server-enforced admin/manager roles (H4).
11. Tighten CORS + image `remotePatterns`; standardize Supabase client (H5).

**Then:** address Medium items, re-run this audit, and confirm a clean pass before going live.

---
*See `SECURITY_RULES.md` for the reusable ruleset and re-run triggers.*
