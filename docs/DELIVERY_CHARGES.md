# Delivery Charge Feature

## Overview
This feature adds **progressive distance-based delivery charges** for orders placed with "Home Delivery" option. Users see real-time delivery cost based on location distance from the cafeteria.

## Pricing Model
**Progressive: ₹10 per km (rounded up)**

| Distance Range | Charge |
|---|---|
| 0.5 - 1.0 km | ₹10 |
| 1.0 - 2.0 km | ₹20 |
| 2.0 - 3.0 km | ₹30 |
| 3.0 - 4.0 km | ₹40 |
| 4.0 - 5.0 km | ₹50 |
| Beyond 5.0 km | Not serviceable |

**Formula:** `charge = ceil(distance) × 10` (max 5 km)

Delivery available up to 5 km only.

## Implementation Details

### Database Changes
1. **`orders` table** (migration: `20260730_delivery_charge.sql`):
   - Added `delivery_charge` column (numeric(10,2), default 0)
   - Stores calculated delivery charge with order

2. **`cafeterias` table** (migration: `20260730_delivery_charge.sql`):
   - Added `latitude` column (double precision)
   - Added `longitude` column (double precision)
   - **Required:** Must be populated for delivery feature to work

### Key Files

#### New Files
- **`lib/utils/deliveryChargeCalculator.ts`**
  - `calculateDistance(lat1, lng1, lat2, lng2)` — Haversine formula for accurate distance (km)
  - `getDeliveryCharge(distanceKm)` — Returns charge amount based on progressive pricing
  - `calculateDeliveryChargeInfo()` — Complete calculation with distance & validation

#### Modified Files
- **`app/mobile/order/[cafeteriaId]/page.tsx`**
  - Added state: `deliveryCharge`, `deliveryDistance`, `deliveryChargeError`
  - Added `useEffect` hook to auto-calculate charge when delivery coordinates change
  - Updated Cafeteria interface to include `latitude` & `longitude` fields
  - Modified order creation logic:
    - Validates delivery location before checkout
    - Calculates order total: `items + deliveryCharge`
    - Stores `delivery_charge` in orders table
    - Passes latitude/longitude to database
  - Enhanced UI displays:
    - **Cart FAB:** Shows total with delivery charge
    - **Cart Sheet:** Subtotal + delivery line item breakdown
    - **Order Details:** Full breakdown before payment
    - **Payment Page:** Correct total amount
    - **Order Type Modal:** Distance & charge preview when location selected
    - **Error State:** Shows message if location outside serviceable area

## User Flow

```
1. Browse menu → Add items to cart
   ↓
2. Proceed to checkout → Select "Home Delivery" 🛵
   ↓
3. Pick delivery location on map (or enter manually)
   ↓
4. System calculates distance from cafeteria to location
   ↓
5. Delivery charge calculated: ceil(distance) × ₹10 (max 5 km)
   ↓
6. Order total updated: Items + Delivery Charge
   ↓
7. Review breakdown in order details
   ↓
8. Proceed to payment with correct total
   ↓
9. Order created with delivery_charge stored
```

## Setup Instructions

### 1. Run Migration in Supabase

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Add delivery_charge column to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_charge numeric(10,2) DEFAULT 0;

-- Add coordinates to cafeterias table for distance calculation
ALTER TABLE cafeterias
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
```

Verify columns exist:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name IN ('orders', 'cafeterias') 
AND column_name IN ('delivery_charge', 'latitude', 'longitude');
```

### 2. Populate Cafeteria Coordinates

Find coordinates via [Google Maps](https://maps.google.com), then update:

```sql
UPDATE cafeterias 
SET latitude = 13.0841374, longitude = 77.4872613
WHERE name = 'LETHAFI';
```

Verify:
```sql
SELECT name, latitude, longitude FROM cafeterias;
```

All cafeterias must have coordinates for delivery to function.

### 3. Deploy

- **Local:** Changes auto-reload via HMR
- **Vercel:** Migrations run automatically on deploy
- **Local Supabase:** Run `supabase db push` if using CLI

## Order Data Structure

Orders with delivery now store:
```json
{
  "id": "uuid",
  "order_type": "delivery",
  "delivery_address": "123 Main St, City",
  "delivery_latitude": 13.0845,
  "delivery_longitude": 77.4875,
  "delivery_charge": 20,
  "total_amount": 520,  // items (500) + delivery (20)
  "items": [...],
  "status": "pending",
  ...
}
```

## Testing Checklist

- [ ] **Database Setup**
  - [ ] Migration applied (columns exist)
  - [ ] Cafeteria coordinates populated
  
- [ ] **Delivery Feature**
  - [ ] Select "Home Delivery" order type
  - [ ] Pick location 0.5-1 km away → ₹10 shown ✓
  - [ ] Pick location 1-2 km away → ₹20 shown ✓
  - [ ] Pick location 2-3 km away → ₹30 shown ✓
  - [ ] Pick location 5+ km away → "Not serviceable" error ✓
  - [ ] Distance & charge visible in order type modal
  - [ ] Distance & charge visible in cart sheet
  - [ ] Distance & charge breakdown visible in order details
  - [ ] Payment page shows correct total (items + delivery)
  
- [ ] **Order Creation**
  - [ ] Order created successfully with delivery info
  - [ ] `delivery_charge` column populated in database
  - [ ] `total_amount` = items + delivery_charge
  - [ ] `delivery_latitude` and `delivery_longitude` stored
  
- [ ] **Edge Cases**
  - [ ] Switching order type from delivery to takeaway removes charge
  - [ ] Changing delivery location updates charge in real-time
  - [ ] Very distant locations calculate correctly

## Security Notes

⚠️ **Current state:** Client-side charge calculation. For production, add **backend validation**:

```typescript
// Suggested: In order creation API route
const chargeInfo = calculateDeliveryChargeInfo(
  cafeteria.latitude, cafeteria.longitude,
  order.delivery_latitude, order.delivery_longitude
);
// Verify or override client-supplied delivery_charge with recalculated value
order.delivery_charge = chargeInfo.charge;
```

This prevents client tampering with delivery charges (same as validating order `total_amount`).

## Troubleshooting

**Issue:** Distance not showing in order type modal
- ✓ Check cafeteria has `latitude` and `longitude` in database
- ✓ Verify coordinates are not NULL
- ✓ Ensure delivery location (coordinates) was picked on map, not typed

**Issue:** Wrong charge amount
- ✓ Verify formula: `ceil(distance) × 10` (₹10 per km)
- ✓ Check max 5 km limit
- ✓ Check distance calculation (use [online Haversine calculator](https://www.movable-type.co.uk/scripts/latlong.html) to verify)

**Issue:** Delivery charge not in order
- ✓ Check `delivery_charge` column exists in orders table
- ✓ Ensure `order_type = 'delivery'` when creating order
