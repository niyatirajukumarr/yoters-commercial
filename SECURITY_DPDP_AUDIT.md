# Security & DPDP Compliance Audit — Yoters (queue-app)

- **Auditor role:** CISO + Data Protection / Compliance Officer (DPDP Act, 2023)
- **Type:** Full static review of the current (post-merge) codebase + fixes applied in this pass
- **Date:** 2026-07-21
- **Stack:** Next.js 16.2.2 (App Router, `proxy.ts` middleware), React 19, Supabase, Razorpay, Twilio, Resend
- **Scope:** Source code, API routes, auth, RLS/SQL, config, and DPDP (India Digital Personal Data Protection Act, 2023) posture. Live-site probing was **not** performed in this pass.

---

## 1. Executive Summary

The codebase has improved dramatically from the original "F — Critical (2.5/10)" baseline (`SECURITY_AUDIT.md`). The security-hardening branch that was merged in fixed the majority of the Critical/High application-security findings: privileged API routes now authenticate via a verified session token and check resource ownership, payment amounts are recomputed server-side, signatures are constant-time verified, security headers/CSP are set, rate limiting is applied, logging is PII-scrubbed, and route protection runs as real middleware.

Two material gaps remained, which this pass addresses:

1. **A live Razorpay secret was still committed** in `SETUP_PAYOUTS.md` (and quoted in `SECURITY_AUDIT.md`). **Fixed in source** (redacted) — but the key **must be rotated** at Razorpay (organizational action; I cannot do this).
2. **No DPDP compliance layer existed** — no privacy notice, no consent capture, no data-principal rights. This pass **implements** a privacy policy, explicit consent at signup, and self-service data export + account deletion.

One **architectural finding is not code-fixable in isolation (C3/M1):** the frontend reads privileged tables (`orders`, `payouts`) directly with the public **anon key**, so the database still relies on permissive RLS (`using (true)`). The hardened RLS SQL is authored (`migrations/20260718_security_hardening.sql`) but **cannot be applied without a client→server data-access refactor** or it breaks the manager/admin dashboards, order history, guest tracking, and vendor updates. This is the top remaining risk.

| Metric | Before merge | Current (post-fixes) |
|---|---|---|
| Application security | F (2.5/10) | **B — Good**, pending RLS refactor + key rotation |
| DPDP compliance | None | **Substantially implemented** (technical controls); pending organizational items |
| Launch readiness | ❌ Not ready | ⚠️ **Conditional** — rotate key, apply migrations, complete RLS refactor |

---

## 2. Methodology

Static review of: all `app/api/**/route.ts`, `proxy.ts`, `lib/*` (auth, razorpay, rate-limit, sanitize, validation, logger, config, login-guard), `next.config.ts`, `supabase/*.sql` + migrations, and the auth/order/payment/track/admin/manager UI. Cross-referenced against the standing ruleset in `SECURITY_RULES.md` (R1–R15) and the DPDP Act, 2023 (notice, consent, purpose/storage limitation, data-principal rights, children's data, security safeguards, breach notification, grievance redressal).

---

## 3. Security Findings — status against the original audit

| ID | Finding | Status | Evidence / fix |
|----|---------|--------|----------------|
| **C1** | Live Razorpay secret committed | ✅ Fixed in source · ⚠️ **rotate at provider** | Redacted in `SETUP_PAYOUTS.md` + `SECURITY_AUDIT.md`; payout route uses env only. Grep confirms no other copies (excl. the merge copy). |
| **C2** | Unauthenticated payment confirmation | ✅ Fixed | `api/confirm-payment` route deleted; only signature-verified `verify-payment`/webhook mark orders paid. |
| **C3** | RLS `using (true)` (world read/write) | 🟥 **Open (architectural)** | Hardened SQL authored (migration) but the app reads `orders`/`payouts` via the anon key in 8+ client pages, so it can't be applied without a data-access refactor. **Top residual risk.** See §6. |
| **C4** | Privileged API routes unauthenticated | ✅ Fixed | `lib/auth-server.ts` — session bearer token + ownership checks (`requireVendorForOrder/Cafeteria`, `requireAdmin`). Identity never from body. |
| **C5** | `seed-demo-item` public write | ✅ Fixed | Route deleted. |
| **C6** | Client-supplied payment amount | ✅ Fixed | `create-order` recomputes the authoritative amount from `orders.total_amount`. |
| **H1** | No rate limiting | 🟨 Mitigated | `lib/rate-limit.ts` on every route. Per-instance/in-memory — add Vercel WAF + shared store (Upstash) for a global limit. |
| **H2** | Missing security headers | ✅ Fixed | `next.config.ts` sets CSP, HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy. |
| **H3** | Weak webhook signature check | ✅ Fixed | `verifyWebhookSignature` now uses `crypto.timingSafeEqual`. |
| **H4** | Client-side admin gate / hardcoded email | 🟨 Mitigated | Env-driven roles (`lib/config.ts`) + server enforcement in payout route; `profiles.role` column authored. Client dashboards still gate by email **and** rely on RLS (see C3). |
| **H5** | Permissive CORS / image host / middleware | ✅ Fixed | Scoped CORS to app origin, `remotePatterns` scoped to Supabase, `proxy.ts` on `@supabase/ssr` (no `@ts-ignore`). |
| **M1** | Order-tracking IDOR | 🟥 Open (tied to C3) | Track page reads order by id via anon client. Fix as part of the RLS refactor (server tracking route). |
| **M2** | Verbose error leakage | ✅ Fixed | Generic client messages; full detail via PII-scrubbed `logger` server-side. |
| **M3** | Dead payout file leaking secret | ✅ Fixed | Proper `api/admin/initiate-payout/route.ts`, admin-gated, env secrets. |
| **M4** | Refund marked successful prematurely | ✅ Fixed | `refund_initiated` on request; promoted to `refund_successful` only on `refund.processed` webhook. |
| **M5** | Placeholder contact data | ✅ Fixed | Payment flow reads the real `student_name/email/phone` from the order. |
| **M6** | SMS notifications are a stub | 🟥 Open | `lib/notifications.ts sendSMS` still logs only. Implement Twilio (needs credentials). |
| **L1** | Weak password policy | ✅ Fixed | 8–72 chars, letter+number, enforced client + server (zod). |
| **L2** | No input validation | ✅ Fixed | `lib/validation.ts` + zod schemas on all auth/API inputs. |
| **L3** | Middleware exempts `/api` + deprecated client | ✅ Fixed | `proxy.ts`; API routes self-protect. |
| **L4** | Hardcoded identity strings | 🟨 Mitigated | Env allowlist + `profiles.role` migration; historical fallback retained. |
| **L5** | `console.log` of PII | ✅ Fixed | `lib/logger.ts` redacts email/phone/name and drops debug in prod. |
| **L6** | Overly broad image host | ✅ Fixed | Scoped `remotePatterns`. |
| **L7** | `access-control-allow-origin: *` | ✅ Fixed | CORS scoped to `NEXT_PUBLIC_APP_URL`. |
| **L8** | Committed env / schema ambiguity | ✅ Fixed | `env.download` deleted + gitignored; schema consolidated (`supabase/README.md`). |

---

## 4. DPDP Act, 2023 Compliance — findings & fixes

| ID | DPDP requirement | Before | Status | Fix applied |
|----|------------------|--------|--------|-------------|
| **D1** | Notice of processing (s.5) | None | ✅ Fixed | `/privacy` — full notice: data collected, purposes, processors, retention, rights, grievance officer, children, security. |
| **D2** | Free, informed, specific consent (s.6) | Non-functional "agree" text | ✅ Fixed | Required consent checkbox at signup; `consent`+`consentVersion` validated server-side (zod `literal(true)`) and stored (`consent_at`, `consent_version`). |
| **D3** | Rights: access, correction, erasure, portability (s.11–12) | None | ✅ Fixed | `GET /api/account/export` (download data) and `POST /api/account/delete` (erasure/anonymisation), surfaced in Settings → *Your data & privacy*. |
| **D4** | Grievance redressal contact (s.13) | None | 🟨 Implemented · **appoint officer** | Grievance Officer block in `/privacy`, configurable via `NEXT_PUBLIC_GRIEVANCE_OFFICER_*`. Placeholder until a real officer is named. |
| **D5** | Storage limitation / retention | None | 🟨 Implemented · **schedule purge** | Retention window (`GRIEVANCE_OFFICER.retentionDays`, 365d) stated in policy; purge SQL documented in the DPDP migration. Needs a scheduled job. |
| **D6** | Children's data (s.9) | None | 🟨 Addressed | 18+ attestation bundled into consent; policy prohibits tracking/targeting minors. Residual: no hard age verification (documented). |
| **D7** | Consent withdrawal as easy as giving it (s.6(4)) | None | ✅ Fixed | Account deletion = withdrawal + erasure; one action in Settings. |
| **D8** | Personal-data breach notification (s.8(6)) | None | 🟥 Organizational | Runbook required to notify the Data Protection Board of India + affected principals. Documented in policy; process must be established. |
| **D9** | Purpose limitation & data minimisation | Partial | ✅ Improved | Purposes enumerated in notice; export returns only the principal's own records; signup stores only non-sensitive metadata (never password). |

**New DPDP database columns** (`migrations/20260721_dpdp_consent.sql`): `consent_at`, `consent_version`, `consent_withdrawn_at`, `data_deleted_at`, `dob`, `is_adult` on `profiles`.

---

## 5. What I changed in this pass

- **Secret leak (C1):** redacted the live Razorpay key from `SETUP_PAYOUTS.md` and `SECURITY_AUDIT.md`; added a rotation warning.
- **Privacy notice:** `app/privacy/page.tsx` (DPDP s.5 notice) and `app/terms/page.tsx`; both made public in `proxy.ts`.
- **Consent:** required checkbox + real Terms/Privacy links in `app/auth/page.tsx`; `signupSchema` now requires `consent`+`consentVersion`; `api/auth/signup` persists the consent record; `CONSENT_VERSION` + `GRIEVANCE_OFFICER` in `lib/config.ts`.
- **Data-principal rights:** `api/account/export` (access/portability) and `api/account/delete` (erasure/anonymisation), wired into `app/profile/settings/page.tsx`.
- **DB migration:** `migrations/20260721_dpdp_consent.sql` (consent/erasure/age columns + retention note).

**Verification:** `npm run build` passes (all routes incl. `/privacy`, `/terms`, `/api/account/*`); `npm run test` 41/41; diagnostics clean on all changed files.

---

## 6. Remaining actions (cannot be done in code from here)

**Blocking for production:**
1. **Rotate the leaked Razorpay live key** in the dashboard — treat as compromised (C1).
2. **RLS data-access refactor (C3/M1):** move every client-side anon read/write of `orders`/`payouts` (manager, admin, profile, refunds, mobile orders, guest tracking, vendor status updates) to **authenticated, authorised server routes**, then apply `migrations/20260718_security_hardening.sql`. Until then the DB is effectively world-readable via the anon key — the single highest risk.
3. **Apply both migrations** to Supabase (`20260718_security_hardening.sql`, `20260721_dpdp_consent.sql`).

**Before launch:**
4. **Appoint & publish a real Grievance Officer** (set `NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME/EMAIL`) (D4).
5. **Establish a breach-notification runbook** with the Data Protection Board of India (D8).
6. **Schedule the retention-purge job** (D5).
7. **Configure Vercel WAF + a shared rate-limit store** (Upstash) — the in-memory limiter is per-instance only (H1).
8. **Implement Twilio SMS** or remove the always-`true` stub so callers see real success/failure (M6).
9. Set `NEXT_PUBLIC_ADMIN_EMAILS` / `NEXT_PUBLIC_MANAGER_EMAILS` to replace the historical-owner fallback (H4/L4).

**Recommended hardening:**
10. Add CI gates from `SECURITY_RULES.md §4`: gitleaks secret scan, `npm audit`, header smoke test, unauthenticated-endpoint auth test, and an RLS lint failing on `using (true)`.
11. Add real age verification if minors are in scope (D6).

---
*This report supersedes the launch verdict in `SECURITY_AUDIT.md` for items marked Fixed. `SECURITY_RULES.md` remains the standing ruleset and re-audit triggers.*
