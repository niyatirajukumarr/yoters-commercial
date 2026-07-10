-- Add order type and delivery address to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'takeaway'
  CHECK (order_type IN ('dine_in', 'takeaway', 'delivery'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address text;
