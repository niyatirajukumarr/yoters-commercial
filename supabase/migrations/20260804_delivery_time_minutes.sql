-- Add delivery_time_minutes column to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_time_minutes integer;

-- Verify the column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name = 'delivery_time_minutes';
