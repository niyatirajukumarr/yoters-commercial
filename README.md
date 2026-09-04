# Yoters 🍽️

A commercial cafeteria pre-ordering platform that eliminates queues and reduces food waste through smart ordering and real-time queue tracking.

## Features

### Mobile App (User)
- **Browse cafeterias** with live queue status (wait time, people waiting)
- **Pre-order food items** with images and descriptions
- **UPI payments** via Razorpay (PhonePe, Google Pay, Paytm, WhatsApp)
- **Track orders** in real-time (new → preparing → ready → pickup)
- **Favorites & preferences** saved locally

### Vendor Dashboard
- **Order management** - view, accept, prepare, mark ready
- **Real-time queue tracking** - monitor wait times and customer count
- **Revenue dashboard** - daily/weekly earnings
- **Menu management** - add/edit food items with images

### Manager Account
- **Payout distribution** - distribute payments to vendors via UPI
- **Settlement reports** - track all vendor payouts
- **Admin controls** - manage cafeterias and staff

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Razorpay (UPI only)
- **Deployment:** Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn
- Supabase account
- Razorpay account (live or test mode)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set environment variables** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_ACCOUNT_ID=your_account_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open:** http://localhost:3000

## Project Structure

```
app/
├── mobile/              # Mobile app
│   ├── (tabs)/         # Bottom nav tabs (home, orders, profile)
│   ├── order/[id]/     # Single cafeteria orders
│   └── track/[id]/     # Order tracking
├── vendor/             # Vendor dashboard
├── admin/              # Manager payout dashboard
├── api/
│   ├── razorpay/      # Payment integration & webhooks
│   ├── confirm-payment/ # Mark orders as paid
│   └── vendor/        # Vendor API endpoints
└── auth/              # Auth pages (login, signup)
```

## Payment Flow

1. User orders → Creates order (status: `pending`)
2. User pays via UPI → Razorpay processes payment
3. Payment confirmed → Order marked as `paid`
4. Vendor sees in dashboard → Accepts and prepares
5. User notified → Picks up when ready

## Mobile app (Android / iOS)

The app is not a separate codebase. It is a Capacitor shell around a **static
export of the customer screens** — same components, same Supabase client, same
API. `scripts/build-app.mjs` copies the sources into `.app-build/`, drops what
`output: 'export'` cannot represent (route handlers, `proxy.ts`, dynamic
segments, staff screens), builds, and lifts the result into `out/`. The working
tree is never modified, so a failed build costs nothing.

The API stays on Vercel. The app reaches it over `NEXT_PUBLIC_API_BASE_URL`, and
every protected route already authenticates from an `Authorization: Bearer`
header rather than a cookie — which is what makes a device-hosted bundle work at
all.

### Build

```bash
# One-time, after cloning
npm install
npx cap add android          # and: npx cap add ios   (needs macOS + Xcode)

# Every build
NEXT_PUBLIC_API_BASE_URL=https://yoters.app npm run app:sync

npx cap open android         # opens Android Studio
npx cap open ios             # opens Xcode
```

`npm run app:sync` = static export + `npx cap sync`. Run it after **any** change
to the web code; Capacitor copies from `out/`, so skipping it ships the previous
bundle.

### Release signing

Driven entirely by environment variables, so no keystore is ever in the repo:

```bash
export ANDROID_KEYSTORE_PATH=/secure/path/yoters-release.jks
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=yoters
export ANDROID_KEY_PASSWORD=...
cd android && ./gradlew bundleRelease      # .aab for Play Store
```

If the variables are absent the signing block is skipped and Gradle falls back
to the debug key, which Play rejects at upload — a missing secret fails loudly
rather than shipping a wrongly-signed artifact.

### Two route shapes

A static export has no server to resolve `/mobile/track/<id>`, and order ids do
not exist at build time. The app therefore addresses those screens by query
string. Both shapes render the identical component, and `lib/routes.ts` picks
the right one per target — so **always link through `orderHref` / `trackHref` /
`deliveryHref`**, never with a hardcoded template literal.

| Screen | Web | App |
|---|---|---|
| Cafeteria menu | `/mobile/order/<slug>` | `/mobile/order?cafe=<slug>` |
| Order tracking | `/mobile/track/<id>` | `/mobile/track?order=<id>` |
| Delivery slip | `/delivery/<id>` | `/delivery?order=<id>` |

## Checks

```bash
npm run verify        # typecheck + lint + tests
npm run secrets:scan  # staged changes;  --all for the whole tree
```

`git config core.hooksPath .githooks` (done by `npm install`) runs the secret
scan, typecheck and lint before every commit. See `RULES.md`.

## Deployment

Deploy to Vercel:
```bash
vercel deploy --prod
```

**Important:** Set all environment variables in Vercel dashboard before deploying.

---

**Status:** Active development 
