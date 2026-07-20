# Yoters — Transfer / Hand-off Package

This is a clean, self-contained copy of the Yoters codebase for hand-off. It
excludes secrets (`.env.local`), build artifacts (`.next/`, `tsconfig.tsbuildinfo`),
dependencies (`node_modules/`), and local editor/tool folders.

## What's included
- Full application source: `app/`, `components/`, `lib/`, `public/`, `scripts/`
- Database: `supabase/schema_commercial.sql` (authoritative) + `supabase/migrations/`
- Config: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`
- Env template: `.env.example` (no real secrets)
- Docs: `README.md`, `AGENTS.md`, `SECURITY_AUDIT.md`, `SECURITY_AUDIT-LATEST.md`, `SECURITY_RULES.md`, `SECURITY_DPDP_AUDIT.md`, `SETUP_PAYOUTS.md`, `supabase/README.md`

## Getting started
1. `npm install`
2. Copy `.env.example` → `.env.local` and fill in real values:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; enables privileged API routes)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PAYOUT_ACCOUNT_NUMBER`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_ADMIN_EMAILS`, `NEXT_PUBLIC_MANAGER_EMAILS`
   - `NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME`, `NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL` (DPDP)
   - `SUPABASE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (auth/email)
3. `npm run build` · `npm run dev` · `npm run test`

## Database setup (Supabase SQL editor)
1. Run `supabase/schema_commercial.sql` (base schema).
2. Apply `supabase/migrations/*` in filename order, ending with:
   - `20260718_security_hardening.sql` — RLS hardening + `profiles.role` **(review §RLS below first)**
   - `20260721_dpdp_consent.sql` — DPDP consent/erasure/age columns

## Outstanding actions before production (see `SECURITY_DPDP_AUDIT.md`)
1. **Rotate the Razorpay key** that was previously leaked — treat as compromised.
2. **RLS data-access refactor:** the client currently reads `orders`/`payouts` with
   the anon key, so `20260718_security_hardening.sql` cannot be applied until those
   reads move to authenticated server routes. This is the top security item.
3. Appoint & publish a real **Grievance Officer** (DPDP).
4. Establish a **breach-notification runbook** (DPDP), schedule the **retention purge**.
5. Add **Vercel WAF + shared rate-limit store**; implement **Twilio SMS**.

The current build passes and the 41 property/lifecycle tests for the maps feature
pass; verify with `npm install && npm run build && npm run test` after transfer.
