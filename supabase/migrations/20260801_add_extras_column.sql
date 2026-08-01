-- Add extras column to orders table to store selected add-ons

ALTER TABLE orders ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_extras ON orders USING gin(extras);
