# Payout System Setup

## 1. Create Payouts Table in Supabase

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  razorpay_payout_id TEXT UNIQUE,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'reversed')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_payouts_vendor ON payouts(vendor_name);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_created ON payouts(created_at);
```

## 2. Add Environment Variables

Add these to your `.env.local`:

```
RAZORPAY_KEY_ID=rzp_live_SydTJERNFEVhv6
RAZORPAY_KEY_SECRET=IjzjfXi3VdatcieikU3PvFhY
RAZORPAY_ACCOUNT_ID=your_account_id_here
```

Get your Account ID from: https://dashboard.razorpay.com/app/settings/account-settings

## 3. Add is_shared Column to Orders

```sql
ALTER TABLE orders ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
```

## 4. Test Payout API

POST /api/admin/initiate-payout
```json
{
  "vendorName": "Lit Bites Cafe",
  "upiId": "9110289805-2@ibl",
  "amount": 5000,
  "orderId": "order_123"
}
```

## 5. How Payouts Work

1. Money comes to your Razorpay account (real-time)
2. After 2 business days, funds settle to your bank
3. System automatically calculates payout amount for each vendor
4. UPI transfer sent to vendor via Razorpay
5. Status tracked in `/admin` dashboard
6. Vendor can see payment in their UPI account

Done! ✅
