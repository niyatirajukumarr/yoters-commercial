-- Migration: Fix orders stuck in pending_payment status
-- This fixes orders that should have transitioned to payment_pending after 60 seconds

-- First, manually transition all old pending_payment orders to payment_pending
UPDATE orders
SET status = 'payment_pending'
WHERE status = 'pending_payment'
  AND payment_status = 'unpaid'
  AND created_at < now() - interval '60 seconds';

-- Also create a trigger to auto-mark on insert/update
CREATE OR REPLACE FUNCTION auto_transition_payment_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- If order is pending_payment and unpaid and over 60 seconds old, transition immediately
  IF NEW.status = 'pending_payment' AND NEW.payment_status = 'unpaid' AND
     NEW.created_at < now() - interval '60 seconds' THEN
    NEW.status := 'payment_pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_transition_payment_pending ON orders;
CREATE TRIGGER trigger_auto_transition_payment_pending
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_transition_payment_pending();
