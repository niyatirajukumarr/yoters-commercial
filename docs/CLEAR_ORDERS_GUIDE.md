# Clearing All Orders - Guide

This guide explains how to clear all orders from the Yoters database for testing or reset purposes.

## Method 1: Via Migration (Recommended)

A migration has been created at:
```
supabase/migrations/20260730_clear_all_orders.sql
```

When you deploy to production or run locally:
1. The migration will automatically execute when Supabase migrations are applied
2. All orders and payouts will be deleted
3. The orders table will start from ID 1

### Deploy locally:
```bash
supabase migration up
```

### Deploy to Vercel/Production:
Simply push to the main branch. Vercel automatically runs pending migrations during deployment.

---

## Method 2: Via Supabase Console (Manual)

If you need to clear orders immediately without waiting for deployment:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** tab
4. Create a new query and paste:

```sql
-- Delete payouts first (references orders)
DELETE FROM payouts;

-- Delete notifications (references orders)
DELETE FROM notifications;

-- Delete all orders
DELETE FROM orders;

-- Reset token sequences
UPDATE token_sequences SET current_token = 0, reset_date = current_date;
```

5. Click **Execute** (or Cmd+Enter / Ctrl+Enter)

---

## Method 3: Via API (In Development)

If you build an API endpoint for clearing orders, it should:
1. Require admin authentication
2. Check authorization before executing
3. Delete in order: payouts → notifications → orders → reset token sequences
4. Return appropriate status codes

---

## Verification

After clearing orders:

### Check the mobile app:
- Navigate to `/mobile/orders` on the student mobile app
- Should show: "No active orders yet"

### Check vendor dashboard:
- Navigate to `/vendor` (vendor login required)
- Orders tab should show: "No active orders right now"

### Check admin dashboard:
- Navigate to `/admin` (admin login required)
- All cafeteria order counts should be 0
- Pending payout amounts should be 0

---

## UI/UX Updates (July 30, 2026)

Orders are now displayed with consistent styling across all dashboards:

### Mobile Orders Page (`/mobile/orders`)
- **Grouped by cafeteria** with heading "Your Orders from [CAFETERIA]"
- Status badges with emojis (⏳ Awaiting Payment, ✅ Collected, ❌ Cancelled)
- Order number badge (#1, #2, etc.)
- Item list with quantities
- Price displayed at bottom
- Action buttons: "Continue to Payment" (active) or "Delete" (past orders)
- Colored left border matching order status

### Vendor Dashboard
- **Consistent order card styling** matching mobile orders
- Status badges with emojis
- Order token badges
- Customer name and phone
- Item list
- Clear action buttons for status progression
- Colored left border

### Admin Dashboard
- Payout management for vendors
- Order counts and revenue tracking

---

## Important Notes

⚠️ **Irreversible Action:**
- Clearing orders **cannot be undone** without a database backup
- Ensure you have backups before clearing in production
- Test in staging first

⚠️ **Foreign Key Dependencies:**
- The migration handles foreign keys automatically
- Payouts are deleted before orders (prevents foreign key constraint errors)
- No manual order-by-order deletion needed

✅ **Safe to use in:**
- Development environments
- Staging for testing
- Production (if you have a backup)
