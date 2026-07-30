# Yoters Commercial - Project Progress

## Project Overview
**Yoters** is a commercial cafeteria pre-ordering platform that eliminates queues and reduces food waste through smart ordering and real-time queue tracking.

### Key Features
- Browse cafeterias with live queue status
- Pre-order food items with images and descriptions
- UPI payments via Razorpay (PhonePe, Google Pay, Paytm, WhatsApp)
- Real-time order tracking (pending → preparing → ready → pickup)
- Vendor dashboard for order management
- Manager payout distribution system

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Razorpay (UPI only)
- **Deployment:** Vercel
- **Additional:** Framer Motion, Three.js, Leaflet Maps, Recharts

## Project Structure

```
app/
├── mobile/              # Mobile app (Student interface)
│   ├── (tabs)/         # Bottom nav tabs (home, orders, profile)
│   ├── order/[id]/     # Single cafeteria orders
│   └── track/[id]/     # Order tracking
├── student/            # Student-specific pages
├── vendor/             # Vendor dashboard & login
├── manager/            # Manager payout dashboard
├── admin/              # Admin interface
├── auth/               # Auth pages (login, signup, reset)
├── browse/             # Browse cafeterias
├── profile/            # User profile & settings
│   ├── favourites/
│   ├── help/
│   ├── payment-modes/
│   ├── refunds/
│   ├── settings/
│   └── vouchers/
├── payment/            # Payment pages
├── api/
│   ├── razorpay/      # Payment integration & webhooks
│   ├── auth/          # Authentication endpoints
│   ├── vendor/        # Vendor API endpoints
│   ├── admin/         # Payout management
│   ├── account/       # User account operations
│   └── [other]/       # Utility endpoints
├── splash/            # Splash screen
└── legal/             # Terms & privacy

lib/
├── hooks/             # Custom React hooks
├── auth-*.ts          # Authentication utilities
├── config.ts          # Configuration
├── money.ts           # Payment utilities
├── notifications.ts   # Notification system
└── [utilities]/

components/
├── ui/                # UI components
├── admin/             # Admin-specific components
├── landing/           # Landing page components
├── icons/             # Icon components
└── [feature]/         # Feature-specific components
```

## Current Status
- ✅ Core platform functional
- ✅ Payment integration (Razorpay UPI)
- ✅ Order management system
- ✅ Real-time queue tracking
- ✅ Vendor dashboard
- ✅ Manager payout system
- 🔄 Active development

## Recent Changes
- Removed "Live Queue Visibility" badge from browse hero
- Gated favourite button behind authentication
- Auth page hero simplified
- Team photo adjustments

## Environment
- **Dev Server:** `npm run dev` (runs on http://localhost:3000)
- **Build:** `npm run build`
- **Deployment:** Vercel (auto-deploy on push)
- **Testing:** Vitest

---

## Important Guidelines
⚠️ **Browser Navigation:** If using browser navigator tools, navigate to **yoters.site** website only.

## Work Log

### 2026-07-30 — Delivery charge feature
Added distance-based delivery charges for "Home Delivery" orders. Implemented Haversine distance calculation and pricing tiers: ≤3 km ₹30, ≤9 km ₹40, ≤12 km ₹50, >12 km blocked with error message. 

**Files**: Created `lib/utils/deliveryChargeCalculator.ts`, DB migration `20260730_delivery_charge.sql`, updated order page to calculate & display charges. User sees breakdown in cart, order details, and payment pages.

**Blockers**: Cafeterias must have `latitude`/`longitude` set in DB; backend order validation should re-verify delivery charge server-side to prevent tampering (addresses security audit gap #1).

### 2026-07-30 — Full-codebase security audit
Ran a full-repo security review (not just the diff) covering all 18 API routes, `proxy.ts` middleware, all 17 Supabase migrations + base schema, and a repo-wide sweep for secrets/XSS/SSRF. Prior audits (`20260718_security_hardening.sql`, `20260730_close_open_rls_gaps.sql`) had already closed most obvious holes; this pass found 4 HIGH, 1 MEDIUM, 1 LOW gaps they missed.

**HIGH — unresolved as of this writing:**
1. **Forged order amount / free food** — `orders` table `INSERT` RLS policy (`schema_commercial.sql:153`, `with check (true)`) has zero validation on `total_amount`/`items`/`payment_status`. `app/api/razorpay/create-order/route.ts` trusts the stored `total_amount` as authoritative, so a forged low-amount (or already-`paid`) row becomes a genuine cheap/free order. Fix: add a `BEFORE INSERT` trigger recomputing `total_amount` from `cafeteria_menu` and forcing `status`/`payment_status` to initial values (same pattern as the existing `protect_menu_item_writes()` trigger).
2. **Payment bypass in `verify-payment`** — `app/api/razorpay/verify-payment/route.ts:31-54` verifies the Razorpay signature is valid for the client-supplied `razorpay_order_id`/`razorpay_payment_id` but never checks those belong to the `orderId` being updated. A cheap real payment's valid signature can be replayed against a different (higher-value) order to mark it paid. Fix: fetch the order by `orderId` first and confirm `order.razorpay_order_id` matches before updating. (`app/api/razorpay/webhook/route.ts` already does this correctly — mirror that pattern.)
3. **Vendor PII/payout leak via public RLS** — `"Public read cafeterias"` policy (`schema_commercial.sql:148`, `using (true)`) exposes `vendor_email` and `upi_id` to anyone with the public anon key via direct PostgREST calls. The `20260730` migration fixed writes to this table but never restricted reads. Fix: add a `cafeterias_public` view exposing only non-sensitive columns; point the browse UI at it; scope the base table SELECT to owner/manager/admin.
4. **Order takeover via unverified phone** — `lib/hooks/useUserInfo.ts:100-104` lets any authenticated user set their own `profiles.phone` to any string (no OTP), and multiple RLS policies (`20260718_security_hardening.sql`, `20260726_*`, `20260727_*`) use `orders.student_phone = current_phone()` as the sole ownership check for read/delete/cancel/collect. Claiming a victim's phone number grants legitimate RLS access to their order history. `app/api/delete-order/route.ts` has the same root issue (checks request-body `studentPhone` with no session/token verification at all). Fix: require phone verification (OTP) before it's trusted as an identity key, or stop using it for RLS ownership matches.

**MEDIUM:**
5. Vendor `UPDATE orders` RLS policy (`20260718_security_hardening.sql:90-100`) has no column restriction — unlike the equivalent `cafeteria_menu` protection, a vendor's browser session can set `payment_status`/`total_amount` directly, bypassing Razorpay verification. Fix: add a `BEFORE UPDATE` trigger limiting vendor writes to `{status, ready_at, collected_at}`.

**LOW:**
6. `proxy.ts` has an explicit `isManager()` check for `/manager` but no equivalent for `/admin` (relies only on client-side gating + downstream RLS/API checks, which do hold). Defense-in-depth fix only.

**Checked clean:** no hardcoded secrets, no `dangerouslySetInnerHTML` usage, no SQL injection surface (no raw/dynamic SQL), `reverse-geocode` host is hardcoded (not SSRF), service-role key never reaches client bundles, webhook signatures use `timingSafeEqual`, login/signup have lockout + no user-enumeration.

**Priority:** fix #1 and #2 first (direct financial loss), then #3 and #4 (data exposure / account takeover).
