-- Migration: Add order status change audit logging and integrity checks
-- Ensures collected orders cannot be unexpectedly changed to cancelled
-- Logs all status changes for vendor accountability

-- Create audit log table
CREATE TABLE IF NOT EXISTS order_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text, -- who changed it (user email or system)
  reason text, -- why it was changed
  changed_at timestamptz DEFAULT now()
);

-- Create index for fast audit queries
CREATE INDEX IF NOT EXISTS idx_order_audit_order_id ON order_status_audit(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_changed_at ON order_status_audit(changed_at);

-- Function to log status changes and prevent invalid transitions
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the status change
  INSERT INTO order_status_audit (order_id, old_status, new_status, changed_at)
  VALUES (NEW.id, OLD.status, NEW.status, now());

  -- Prevent collected orders from being changed to cancelled (data integrity)
  IF OLD.status = 'collected' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot change collected order to cancelled. Order ID: %', NEW.id;
  END IF;

  -- Prevent collected orders from being downgraded to unprepared states
  IF OLD.status = 'collected' AND NEW.status IN ('pending_payment', 'payment_pending', 'pending_approval', 'approved', 'preparing', 'ready') THEN
    RAISE EXCEPTION 'Cannot downgrade collected order to % status. Order ID: %', NEW.status, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_order_status_change();

-- Add comment explaining the protection
COMMENT ON TABLE order_status_audit IS 'Audit log for all order status changes - use to track order lifecycle and debug revenue discrepancies';
