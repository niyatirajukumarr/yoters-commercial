# Delivery Charge Feature

## Overview
This feature adds distance-based delivery charges for orders placed with "Home Delivery" option.

## Pricing Tiers
- **Up to 3 km**: ₹30
- **Up to 9 km**: ₹40
- **Up to 12 km**: ₹50
- **Beyond 12 km**: Not serviceable (error message shown)

## Implementation Details

### Database Changes
1. **`orders` table**:
   - Added `delivery_charge` column (numeric, default 0)

2. **`cafeterias` table**:
   - Added `latitude` column (double precision)
   - Added `longitude` column (double precision)

### Key Files Modified
1. **`lib/utils/deliveryChargeCalculator.ts`** (new)
   - `calculateDistance()` - Calculates distance using Haversine formula
   - `getDeliveryCharge()` - Returns charge based on distance
   - `calculateDeliveryChargeInfo()` - Complete charge calculation with validation

2. **`app/mobile/order/[cafeteriaId]/page.tsx`**
   - Added state: `deliveryCharge`, `deliveryDistance`, `deliveryChargeError`
   - Added `useEffect` to calculate delivery charge when coordinates change
   - Updated order creation to include `delivery_charge`
   - Updated UI to show delivery charge breakdown:
     - Cart sheet: Delivery charge line item
     - Order details page: Subtotal + Delivery charge
     - Payment page: Correct total
     - Order type modal: Distance and charge preview

### Flow
1. User selects "Home Delivery" order type
2. User picks delivery location on map
3. `DeliveryMapModal` returns coordinates
4. `useEffect` calculates distance and delivery charge
5. Distance > 12 km shows error, disables checkout
6. UI shows delivery distance and charge breakdown
7. Order total includes delivery charge
8. Order created with `delivery_charge` and `delivery_latitude/longitude`

### Setup Required
**Before using this feature**, ensure cafeterias have coordinates set:

```sql
UPDATE cafeterias 
SET latitude = <LAT>, longitude = <LNG>
WHERE id = '<CAFETERIA_ID>';
```

**Example for Lethafi** (from `lethafiLocation.ts`):
```sql
UPDATE cafeterias 
SET latitude = 13.0841374, longitude = 77.4872613
WHERE name = 'Lethafi';
```

### Error Handling
- If cafeteria coordinates are missing, delivery mode shows no distance info
- If distance > 12 km, user sees: "Uh-oh! Sorry, we don't deliver to this area. Please select a location within 12 km."
- Validation prevents order placement if delivery is out of range

### Testing Checklist
- [ ] Set cafeteria coordinates in database
- [ ] Select delivery order type and pick location ≤ 3 km → ₹30 charge
- [ ] Select location between 3-9 km → ₹40 charge
- [ ] Select location between 9-12 km → ₹50 charge
- [ ] Select location > 12 km → Error message shown, checkout disabled
- [ ] Verify order total includes delivery charge
- [ ] Verify payment amount is correct (items + delivery)
- [ ] Verify order `delivery_charge` column in database has correct value
