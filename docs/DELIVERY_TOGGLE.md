# Vendor Delivery Toggle Feature

## Overview
Vendors can now turn off delivery service when they're unable to provide it. When disabled, customers see "Not available now" for the delivery option and cannot select it.

## How It Works

### For Vendors (Dashboard)
1. Go to **Settings** tab in vendor dashboard
2. Find **Delivery Status** toggle (next to Restaurant Status)
3. Click to toggle between:
   - **🛵 Available** (green) — Delivery enabled, customers can order delivery
   - **❌ Unavailable** (grey) — Delivery disabled, customers see grayed-out delivery option

### For Customers (Mobile App)
When delivery is disabled:
- Delivery option appears **grayed out** in the order type modal
- Shows **"Not available now"** instead of the normal description
- **Cannot be selected** — clicking does nothing
- Customers can still use Dine In or Take Away

## Database

### Schema Change
**Migration:** `supabase/migrations/20260804_delivery_available_flag.sql`

```sql
ALTER TABLE cafeterias
  ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT true;
```

**Default:** `true` (delivery enabled by default)

### Data Structure
```json
{
  "id": "cafeteria-uuid",
  "name": "LETHAFI",
  "delivery_available": true,
  ...
}
```

## API

### Toggle Delivery Endpoint
**Endpoint:** `POST /api/admin/toggle-delivery`

**Request:**
```json
{
  "cafeteriaId": "cafeteria-uuid",
  "delivery_available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery enabled",
  "cafeteria": { ... }
}
```

## Implementation Details

### Files Modified

1. **`app/mobile/order/[cafeteriaId]/page.tsx`**
   - Added `delivery_available` to Cafeteria interface
   - Updated order type modal to disable/gray out delivery option
   - Shows "Not available now" message when disabled
   - Button appears grayed (50% opacity) with `cursor: not-allowed`

2. **`app/vendor/page.tsx`**
   - Added `deliveryAvailable` and `togglingDelivery` state
   - Initialized from cafeteria data on load
   - Added `toggleDelivery()` function calling admin API
   - Added Delivery Status toggle button in Settings section
   - Shows emoji indicators: 🛵 (available) / ❌ (unavailable)

### Files Created

1. **`app/api/admin/toggle-delivery/route.ts`**
   - Admin API endpoint to update delivery_available flag
   - Accepts POST with cafeteriaId and delivery_available boolean
   - Returns updated cafeteria data

2. **`supabase/migrations/20260804_delivery_available_flag.sql`**
   - Database migration adding the column
   - Defaults to true for existing cafeterias

## Setup Instructions

### 1. Run Migration
In Supabase SQL Editor:
```sql
-- Run the migration
ALTER TABLE cafeterias
  ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT true;

-- Verify
SELECT name, delivery_available FROM cafeterias;
```

### 2. Deploy Code
- Changes auto-reload in dev via HMR
- In production: push to main → Vercel auto-deploys

### 3. Test

**Vendor Side:**
1. Log into vendor dashboard
2. Go to Settings tab
3. Toggle "Delivery Status" on/off
4. See change in real-time

**Customer Side:**
1. Open mobile app
2. Select a cafeteria
3. Add items and view cart
4. See delivery option disabled/grayed out when vendor has it off
5. Verify can't click disabled delivery option

## User Flow

```
Vendor Disables Delivery
    ↓
Delivery Status = false in DB
    ↓
Customer opens menu
    ↓
Cafeteria data fetched with delivery_available = false
    ↓
Delivery option appears grayed out
    ↓
Customer sees "Not available now"
    ↓
Delivery button is unclickable
    ↓
Customer can use Dine In or Take Away instead
```

## Notes

- Toggle is **real-time** — applies immediately to new orders
- Doesn't affect **existing active orders** (already in progress)
- Customers need to **refresh** the app to see the change
- Works alongside existing **Restaurant Status** (Open/Closed) toggle
- Can be toggled **unlimited times** — no rate limiting
