# Yoters 🍽️

A commercial cafeteria pre-ordering platform that eliminates queues and reduces food waste through smart ordering and real-time queue tracking.

## Features

### Mobile App (Student)
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

## Deployment

Deploy to Vercel:
```bash
vercel deploy --prod
```

**Important:** Set all environment variables in Vercel dashboard before deploying.

---

**Status:** Active development 
