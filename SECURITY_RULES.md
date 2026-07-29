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

### RLS remediation hygiene (added 2026-07-30, after finding all four of these had actually happened)
- **R16** An RLS fix pass must inventory **every** table's policies, not just the ones connected to the finding that prompted it. The 2026-07-18 hardening migration fixed `orders`/`payouts` but left `cafeterias`, `cafeteria_menu`, `cafeteria_queues`, `token_sequences`, and `notifications` on their original `using (true)` policies for another 12 days — nobody re-grepped the *whole* schema after the "orders" fix shipped. Run the full `using (true)` grep (§5) against **all** tables, every time.
- **R17** When a remediation drops a policy by name (`drop policy if exists "X" on t`), the name must be copy-pasted from the `create policy` statement that actually defined it — case-sensitive, exact match. `DROP POLICY IF EXISTS` silently no-ops on a mismatch, which looks identical to success. (`manager_audit_log`'s lockdown silently failed this way for 12 days: the migration dropped `"Public read audit"` when the real policy was named `"Public read audit log"`.) After writing any such drop, grep the target migration file for the exact string to confirm it exists.
- **R18** Every `create policy` / `create trigger` in a migration must be preceded by the matching `drop ... if exists`. Postgres has no `CREATE POLICY IF NOT EXISTS`, so a migration re-run after a partial failure will error on the first policy that already landed — treat every RLS/trigger migration as re-runnable from scratch.
- **R19** If a trigger function writes to a table whose RLS you are about to tighten, and that trigger can fire from a caller who is *not* the newly-required owner (e.g. a guest customer's order insert updating `cafeteria_queues`'s count, or a vendor's order update assigning a `token_sequences` row), the function must be `SECURITY DEFINER` (`set search_path = public`) before the policy is tightened — otherwise the tightened policy silently breaks the trigger for that caller, not just direct client writes.

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
- **T8** After *any* RLS remediation migration — re-grep `using (true)` / `for all` across **every** table in `supabase/*.sql`, not just the tables the migration touched, and diff every `drop policy` name against an actual `create policy` name in the migration history (R16/R17).

**Automate T1–T5** as a pre-deploy CI gate (see §4).

---

## 3. Re-Run Prompt (paste to reproduce this audit)

> Act as a senior developer + red-team pentester + QA. Perform a **read-only, non-destructive** security audit of this repo and the live site `yoters-commercial.vercel.app`.
> 1. Scan for hardcoded secrets (service-role keys, `rzp_live/test`, Twilio `AC…`, Resend `re_…`, JWTs, private keys) across all source, docs, and SQL.
> 2. Review every `app/api/**/route.ts` for authentication, authorization (no trusting body-supplied identity), server-side amount verification, and constant-time signature checks.
> 3. Review `supabase/*.sql` RLS **for every table**, not just the ones touched by the last remediation: flag any `using (true)` / `for all using (true)` / missing ownership scoping / anon access to payout/audit tables. For any prior remediation migration, confirm each `drop policy if exists "X" on t` names a policy that was actually `create policy`'d somewhere — a name mismatch means the drop silently did nothing.
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

# Whole-schema RLS grep (R16) — run this, not a grep scoped to one table.
# Anything printed here needs a scoped policy or a documented, trigger-guarded
# exception (see cafeteria_menu's "Menu updates" policy for the pattern).
grep -rniE "using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)" supabase/*.sql supabase/migrations/*.sql

# Drop/create name-mismatch check (R17) — for a given migration, confirm every
# `drop policy if exists "X" on t` name also appears in a `create policy "X"`
# somewhere in the migration history; a name that only appears in the drop
# line never existed and the drop was a no-op.
```
