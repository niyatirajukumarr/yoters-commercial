-- Repair the orders status constraint to include all valid statuses
-- This is needed because previous migrations had incomplete constraint definitions
-- 
-- Safe to run multiple times (uses IF EXISTS / IF NOT EXISTS patterns)

BEGIN;

-- Drop the existing constraint if it exists
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the corrected constraint with all valid statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment', 'payment_pending', 'pending_approval', 'approved', 'preparing', 'ready', 'collected', 'cancelled', 'paid', 'pending'));

COMMIT;
