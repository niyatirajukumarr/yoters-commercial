-- Migration: Add Cashfree payment, vendor approval flow, and manager dashboard
-- Date: 2026-05-23

-- Step 1: Add UPI ID to cafeterias
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Step 2: Add payment tracking columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS denied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Step 3: Update order status enum to include 'approved'
-- Update the constraint to allow the new status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','approved','preparing','ready','collected','cancelled'));

-- Step 4: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'vendor', 'manager')),
  recipient_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sms_sent BOOLEAN DEFAULT false,
  sms_response TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 5: Create manager audit log table
CREATE TABLE IF NOT EXISTS manager_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_manager ON manager_audit_log(manager_email);

-- Step 7: Add notifications to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 8: Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_audit_log ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for notifications
DROP POLICY IF EXISTS "Public read notifications" ON notifications;
CREATE POLICY "Public read notifications" ON notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Create notifications" ON notifications;
CREATE POLICY "Create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update notifications" ON notifications;
CREATE POLICY "Update notifications" ON notifications
  FOR UPDATE USING (true);

-- Step 10: Create RLS policies for audit log
DROP POLICY IF EXISTS "Public read audit log" ON manager_audit_log;
CREATE POLICY "Public read audit log" ON manager_audit_log
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Create audit log" ON manager_audit_log;
CREATE POLICY "Create audit log" ON manager_audit_log
  FOR INSERT WITH CHECK (true);

-- Step 11: Update trigger to include 'approved' status in queue count
CREATE OR REPLACE FUNCTION update_cafeteria_queue()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM orders
  WHERE cafeteria_id = COALESCE(new.cafeteria_id, old.cafeteria_id)
    AND status IN ('pending', 'paid', 'approved', 'preparing');

  UPDATE cafeteria_queues
  SET queue_count = active_count,
      updated_at = now()
  WHERE cafeteria_id = COALESCE(new.cafeteria_id, old.cafeteria_id);

  RETURN new;
END;
$$ LANGUAGE plpgsql;
