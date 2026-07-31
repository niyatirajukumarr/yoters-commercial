-- Migration: Add pending_payment and pending_approval statuses for new payment flow
-- This changes the order flow to:
-- pending_payment (0-60s): User hasn't paid yet, vendor doesn't see it
-- payment_pending (60+ sec unpaid): User abandoned payment, vendor can remind/delete
-- pending_approval: Payment confirmed, vendor can accept/deny
-- approved/preparing/ready/collected: Rest of the flow

-- Update the orders_status_check constraint to include new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment','payment_pending','pending_approval','approved','preparing','ready','collected','cancelled'));

-- Add created_at if not exists (needed to calculate timeout)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Create a function to auto-mark orders as payment_pending after 60 seconds if still unpaid
CREATE OR REPLACE FUNCTION auto_mark_payment_pending()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET status = 'payment_pending'
  WHERE status = 'pending_payment'
    AND payment_status = 'unpaid'
    AND created_at < now() - interval '60 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries on pending_payment status with age check
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_timeout
  ON orders(created_at)
  WHERE status = 'pending_payment' AND payment_status = 'unpaid';
