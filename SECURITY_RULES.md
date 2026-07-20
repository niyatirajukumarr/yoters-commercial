# Security Rules & Re-Audit Triggers — queue-app

Reusable ruleset so the audit in `SECURITY_AUDIT.md` is repeatable. Rules are the invariants to hold; Triggers are the conditions that require re-running the checks; the Re-Run Prompt reproduces the whole audit.

---

## 1. Standing Security Rules (invariants)

### Secrets
- **R1** No secret (Razorpay key secret, Supabase service-role key, Twilio/Resend tokens) may appear in any `.ts/.tsx/.js/.sql/.md` file. Secrets live only in Vercel env vars / `.env*` (which is git-ignored).
- **R2** `NEXT_PUBLIC_*` is public by definition — never put a secret behind that prefix. The Supabase **anon** key is public; the **service-role** key never is.
- **R3** A leaked secret is treated as compromised: rotate at the provider first, then purge from git history.

### Database (Supabase / RLS)
- **R4** RLS enabled on every table AND no policy uses `using (true)` / `with check (true)` for `select`/`update`/`delete`/`all` on tables holding user data, orders, or payouts.
- **R5** Policies scope rows by `auth.uid()` or verified ownership. Payout/audit/admin tables are service-role-only (no anon policy).
- **R6** The service-role client is used **only** in server routes that have already authenticated and authorized the caller.

### API routes
- **R7** Every `app/api/**/route.ts` authenticates the caller (Supabase session) before any privileged action. Identity is never read from a request-body field (`vendorEmail`, `studentPhone`, etc.).
- **R8** Payment amounts are computed/verified server-side from trusted DB rows — never trusted from the client.
- **R9** Payment/webhook signatures are verified with `crypto.timingSafeEqual` (constant-time) on **all** paths.
- **R10** No seeding/demo/debug endpoint is reachable in production.
- **R11** Error responses are generic; full error detail is logged server-side only.

### Platform / headers / limits
- **R12** All responses set: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`.
- **R13** CORS is scoped to the app origin (no `access-control-allow-origin: *` on authenticated/API responses).
- **R14** Rate limiting (Vercel WAF or app-level limiter) covers all `/api/*`, especially auth, payment, and notification (SMS/email cost) routes.
- **R15** `next.config.ts` `images.remotePatterns` lists only known hosts (no `hostname: '**'`). Auth/role checks are enforced server-side, never client-email string comparisons.

---

## 2. Re-Audit Triggers (when to re-run)

Re-run the full audit whenever **any** of these happen:
- **T1** A new or modified file under `app/api/**` (any new route, or change to auth/DB logic).
- **T2** Any change to `supabase/*.sql`, RLS policies, or DB schema.
- **T3** Any change to `lib/razorpay.ts`, `lib/supabase.ts`, `lib/notifications.ts`, or `app/middleware.ts`.
- **T4** Adding/rotating any payment, auth, SMS, or email provider or credential.
- **T5** Changes to `next.config.ts`, CORS, headers, or `vercel.ts`/`vercel.json`.
- **T6** Before every production deploy / launch, and after any dependency bump of `next`, `@supabase/*`, `razorpay`, `twilio`, `resend`.
- **T7** Any secret-scanning or dependency-audit alert.

**Automate T1–T5** as a pre-deploy CI gate (see §4).

---

## 3. Re-Run Prompt (paste to reproduce this audit)

> Act as a senior developer + red-team pentester + QA. Perform a **read-only, non-destructive** security audit of this repo and the live site `yoters-commercial.vercel.app`.
> 1. Scan for hardcoded secrets (service-role keys, `rzp_live/test`, Twilio `AC…`, Resend `re_…`, JWTs, private keys) across all source, docs, and SQL.
> 2. Review every `app/api/**/route.ts` for authentication, authorization (no trusting body-supplied identity), server-side amount verification, and constant-time signature checks.
> 3. Review `supabase/*.sql` RLS: flag any `using (true)` / missing ownership scoping / anon access to payout/audit tables.
> 4. Fetch **only** public read-only headers and do GET probes of API routes (no POST/PUT/DELETE, no data mutation) to confirm which routes are reachable and unauthenticated.
> 5. Check for rate limiting and the security-header set (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS).
> Output: findings by severity (Critical/High/Medium), a security rating, a launch-readiness verdict, and a blocking checklist. **Do not modify any code** — auditor role only. Write results to `SECURITY_AUDIT.md`.

---

## 4. Suggested automated gates (optional, additive — no existing code changed)
- **Secret scanning:** add `gitleaks` (or GitHub secret scanning) as a CI step failing the build on any match.
- **Dependency audit:** `npm audit --production` + Dependabot on `next`, `@supabase/*`, `razorpay`, `twilio`, `resend`.
- **Header check:** a CI smoke test asserting the R12 header set on a preview deployment.
- **Endpoint auth test:** CI hits each `/api/*` route unauthenticated and asserts `401/403` (never `200`) for privileged ones.
- **RLS lint:** a script grepping `supabase/*.sql` for `using (true)` that fails CI.

---

## 5. Quick reference — non-destructive probe commands
```bash
# Public headers only (read-only)
curl -sS -D - -o /dev/null https://yoters-commercial.vercel.app/

# Confirm which security headers are missing
curl -sS -D - -o /dev/null https://yoters-commercial.vercel.app/ \
  | grep -iE "content-security|x-frame|x-content-type|referrer-policy|permissions-policy|strict-transport"

# Route reachability (GET only — never sends a mutating payload)
for p in /api/vendor/orders /api/confirm-payment /api/seed-demo-item; do
  echo "$p -> $(curl -sS -o /dev/null -w '%{http_code}' https://yoters-commercial.vercel.app$p)"
done
```
