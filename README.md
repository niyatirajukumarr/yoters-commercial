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

### Getting a build onto a phone

Every push produces two APKs, under the workflow run's **Artifacts**:

| Artifact | Use |
|---|---|
| `yoters-debug-apk-installable` | **This is the one to install.** Signed with the debug keystore, so a phone will accept it. Installs as `com.yoters.app.debug`, alongside any store build. |
| `yoters-release-apk-unsigned-do-not-install` | Proof that R8 did not strip anything. Unsigned, so Android rejects it with `INSTALL_PARSE_FAILED_NO_CERTIFICATES`. |

Download the debug one, transfer it to the phone, and allow install from unknown
sources when prompted.

#### Make updates installable (one-time setup)

Each CI runner is a fresh machine, so with no key configured Gradle invents a
random debug keystore per build. Android then refuses to install the new APK
over the old one — **"App not installed"** — because the signature changed, and
every update means uninstalling first.

Fix it once by generating a stable testing key and storing it as a secret. It is
a *debug* key: it can never publish to Play, and it is deliberately kept out of
the repository anyway.

```bash
keytool -genkey -v -keystore yoters-debug.jks -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android -keypass android \
  -dname "CN=Yoters Debug, O=Yoters, C=IN"

base64 -w0 yoters-debug.jks    # macOS: base64 -i yoters-debug.jks
```

Add the output as the repository secret `ANDROID_DEBUG_KEYSTORE_BASE64`, then
`ANDROID_DEBUG_KEYSTORE_PASSWORD=android`, `ANDROID_DEBUG_KEY_ALIAS=androiddebugkey`
and `ANDROID_DEBUG_KEY_PASSWORD=android`. Keep `yoters-debug.jks` in a password
manager and out of the repo — `.gitignore` and the secret scanner both block it.

Until that secret exists the build still succeeds, but logs a warning and every
install needs a prior uninstall.

Secrets are read when the build runs and compiled into the APK, so **changing a
secret does nothing to an APK that already exists** — trigger a fresh run
afterwards. Actions → CI → *Run workflow*. Leave the "Also build a signed Play
bundle" box unticked unless the release signing secrets are configured; ticking
it without them fails the run on purpose.

For it to reach a real backend, these repository secrets must be set
(Settings → Secrets and variables → Actions) *before* the build runs — they are
compiled into the APK, so a build made without them talks to placeholders:
`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

Note that `NEXT_PUBLIC_APP_URL` is *not* one of them: it is read server-side by
lib/cors.ts, so it belongs in Vercel's environment variables, not here.

### iOS

The iOS project is committed alongside the Android one, and CI builds it
unsigned on a macOS runner (`build-ios`) — so a broken Info.plist, a missing
pod or a plugin that will not compile for arm64 is caught without anyone owning
a Mac. That job runs on `main`, on a manual dispatch, and on a PR labelled
`ios`, because macOS runner minutes cost roughly 10x a Linux one.

What CI **cannot** do is sign. Putting the app on a real iPhone needs an Apple
Developer Program membership (99 USD/year); after that, TestFlight distributes
to testers and a Mac with Xcode is needed to debug anything on-device.

Three Info.plist entries are load-bearing and must not be dropped:

- `NSLocationWhenInUseUsageDescription` — iOS **terminates the app** the instant
  it requests a permission with no usage string. This is a crash, not a warning.
- `LSApplicationQueriesSchemes` — iOS refuses `canOpenURL` for undeclared
  schemes, so without the UPI entries Razorpay cannot detect PhonePe, Google Pay
  or Paytm and the payment silently fails. Counterpart to `<queries>` in
  AndroidManifest.xml.
- `ITSAppUsesNonExemptEncryption = false` — the app uses only standard HTTPS,
  which is exempt; declaring it answers the export-compliance prompt once
  instead of on every TestFlight upload.

### Release signing

Driven entirely by environment variables, so no keystore is ever in the repo:

```bash
export ANDROID_KEYSTORE_PATH=/secure/path/yoters-release.jks
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=yoters
export ANDROID_KEY_PASSWORD=...
cd android && ./gradlew bundleRelease      # .aab for Play Store
```

If the variables are absent the signing config is not applied and AGP emits an
**unsigned** APK, which Play refuses at upload — a missing secret produces an
obviously unusable artifact rather than a plausible-looking one signed with the
wrong key. CI enforces this too: the verification job builds unsigned on every
push, and the signed `release-android` job runs only on a `v*` tag or a manual
dispatch, failing up front if a required secret is missing.

### What the app opens on

Capacitor loads `index.html` from the bundle root. The marketing landing page is
pruned from the app build — whoever installed the app is past the pitch — and
`scripts/build-app.mjs` writes a redirect in its place that sends the webview
straight to `/mobile/home/`. The build *fails* if that route is not in the
bundle, so a rename cannot quietly ship an app that launches onto a blank page.

Pruning the landing page also drops the assets only it referenced, which is most
of the bundle's weight:

| Asset | Size | Belonged to |
|---|---|---|
| `hero-video.mp4` | 3.5 MB | the landing page |
| `sound beat.mp3` | 32 KB | the vendor dashboard (already pruned) |
| `friends-bg.jpg` | 16 KB | nothing at all |

The 3D penguin stays: `/auth` and `PenguinFace` use it, and both ship in the app.

The website is unaffected — `/` still serves the landing page there.

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
