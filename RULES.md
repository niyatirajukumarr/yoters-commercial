# Yoters — engineering rules

Yoters takes money for food orders. That single fact sets the bar: a bug here
either charges someone who got no food, or feeds someone who did not pay, and a
leaked credential lets a stranger do both. Everything below follows from it.

These rules are enforced by machinery, not by memory — a rule nobody can bypass
by accident is worth ten written down. Where a rule has a check behind it, the
check is named.

---

## 1. Before every commit

`git config core.hooksPath .githooks` once per clone (`npm install` does it via
`prepare`). The hook then runs on every commit:

| Step | Command | Blocks on |
|---|---|---|
| Secret scan | `npm run secrets:scan` | any credential in staged content |
| Typecheck | `npm run typecheck` | any type error |
| Lint | `npm run lint` | any lint **error** (warnings pass) |

`npm run verify` runs all three plus the test suite. CI (`.github/workflows/ci.yml`)
repeats them on every push, so bypassing the hook with `--no-verify` delays the
failure rather than avoiding it.

**Never `--no-verify` to get a commit through.** If a check is wrong, fix the
check in its own commit and say why.

---

## 2. Secrets

**No credential is ever written to a file in this repository.** Not in a
comment, not in a test fixture, not "temporarily", not in a file you plan to
delete before pushing.

- Everything comes from `process.env`. `.env.example` lists every variable with
  its purpose and **no values**.
- `NEXT_PUBLIC_*` is compiled into the JavaScript bundle and into the shipped
  APK. Anyone can read it. Only put things there that are public by design (the
  Supabase anon key, the Razorpay **key id**). A secret with a `NEXT_PUBLIC_`
  prefix is a published secret.
- Server-only values (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`,
  `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY`, `SUPABASE_WEBHOOK_SECRET`) may only be
  read inside `app/api/**` or `lib/*-server.ts`. If one is reachable from a
  `'use client'` file, it is already compromised.
- Signing material (`*.keystore`, `*.jks`, `*.p12`, `google-services.json`)
  lives in a password manager and in CI secrets. `.gitignore` and the scanner
  both block it. The keystore reaches CI as `ANDROID_KEYSTORE_BASE64`, is
  written to the runner's temp dir, and is deleted in an `always()` step so it
  does not survive a failed build.

`scripts/scan-secrets.mjs` decodes JWT payloads rather than matching on shape,
so a Supabase **storage signed URL** passes and a **service-role key** does not.
To silence a genuine false positive, put `scan-secrets-allow` on that line — and
justify it in the commit message.

**If a secret is ever pushed: rotate it.** Rewriting history does not help;
assume it was scraped within minutes.

---

## 3. Authentication and authorization

- **Identity comes from a verified token, never from the request body.** Every
  protected route calls `getAuthedUser` / `requireAdmin` / `requireManager` /
  the vendor-ownership helper in `lib/auth-server.ts`, which verifies the
  `Authorization: Bearer` token server-side. A field like `vendorEmail` in a
  JSON body is a claim by the caller, not a fact.
- This is also what makes the mobile app possible: cookies are not shared
  between the device origin and the API origin, so bearer tokens are the only
  scheme that works on both targets. Do not introduce a cookie-authenticated
  API route.
- Client-side role checks (`isAdmin`, `isManager` from `lib/config.ts`) hide
  UI. They are **not** authorization. The server check is the authorization.
- Payment state changes only from a source that proves itself: a verified
  Razorpay signature or the webhook's HMAC. Never from a client saying it paid.

---

## 4. Zero-trust checklist for anything new

Run through this before opening a PR that adds a route, a form, or a payment
path. It is short on purpose — a checklist nobody finishes protects nothing.

1. **Who can call this?** Anonymous, any logged-in user, or one specific role?
   Which line of code enforces that?
2. **What if the caller lies?** Assume every id, amount, quantity and price in
   the request body is attacker-chosen. Prices come from the database, never
   from the client. (`lib/utils/orderTotal.ts` is the one place totals are
   computed.)
3. **What is logged?** Order ids, payment ids, names, emails, phone numbers and
   addresses go through `lib/logger.ts`, which scrubs them. On the packaged app,
   `console.log` writes to logcat/Console.app where anyone holding the phone can
   read it — this is why `no-console` is a lint *error*.
4. **Can it be replayed?** Webhooks and payment confirmations must be
   idempotent; the same delivery arriving twice must not pay a vendor twice.
5. **What does the user see when it fails?** Never a raw error or a stack trace.
   An order that half-succeeded is worse than one that cleanly failed.

Anything touching payment, auth, or personal data gets a deliberate adversarial
read before merge — `/security-review` on the branch diff is the fast version.

---

## 5. Data protection (DPDP Act, 2023)

- Collect only what an order needs. A field nobody reads is a liability.
- `CONSENT_VERSION` in `lib/config.ts` is bumped whenever the privacy notice
  materially changes, which re-prompts users who consented to the old one.
- Account export and deletion (`/api/account/export`, `/api/account/delete`)
  are user rights, not features. They must keep working.
- The grievance contact in `lib/config.ts` must be a real, monitored address
  before launch. The fallback is a placeholder and is not valid.

---

## 6. Mobile app specifics

The app is a Capacitor shell around a **static export of the same codebase** —
one source of truth, two build targets. `README.md` has the build commands.

- **Never link to a dynamic route directly.** Use `orderHref`, `trackHref`,
  `deliveryHref` from `lib/routes.ts`. The web target gets `/mobile/track/<id>`;
  the app target gets `/mobile/track?order=<id>`, because a static export cannot
  resolve a path segment. A hardcoded template-literal href works on the website
  and 404s on the phone.
- **Never call `fetch('/api/...')` directly.** Use `apiFetch` from `lib/api.ts`.
  A relative path resolves against the device in the app build. `apiFetch` also
  attaches the Supabase bearer token.
- **Never add a CORS header in `next.config.ts`.** A static header carries one
  origin; the API serves three (the site, plus `https://localhost` and
  `capacitor://localhost` from the app). `lib/cors.ts` picks per request and
  `proxy.ts` applies it. Adding a new allowed origin means
  `API_ALLOWED_ORIGINS`, never a wildcard — and never
  `Access-Control-Allow-Credentials`, since identity is a bearer token and
  ambient credentials would let a hostile page ride a logged-in session.
- Native code paths live behind `lib/native/index.ts` and return early on web,
  so the website is never affected by them.
- `android/` is committed on purpose: the manifest, the network security config
  and the signing setup are security surface and belong in review. Its build
  output is ignored.
- Release builds run R8. Any new Capacitor plugin needs a keep rule in
  `android/app/proguard-rules.pro`, or it will build, install, and then silently
  do nothing at runtime.

---

## 7. Known debt

Tracked so it stays visible and does not quietly grow.

- **`react-hooks/set-state-in-effect` — 11 sites, currently a warning.** React
  19's cascading-render advisory. Restructuring these changes render timing on
  the order and payment screens, which needs its own change and its own testing.
- **`@typescript-eslint/no-explicit-any` — ~88 sites, warning.** Mostly Supabase
  row shapes and Razorpay callbacks. Type them as they are touched.
- **CSP still carries `'unsafe-inline'` and `'unsafe-eval'`.** Required by
  Next's inline bootstrap and Razorpay checkout today. Move to nonces once
  validated on a preview deploy.
- **`components/screens/CafeteriaOrderScreen.tsx` is ~3,400 lines.** It is the
  highest-risk file in the repo and the hardest to review. Split it when the
  next feature lands in it, not in a dedicated refactor.

New debt gets added here in the same commit that creates it.
