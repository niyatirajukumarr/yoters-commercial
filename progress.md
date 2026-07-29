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
*Ready to begin work. Awaiting tasks.*
