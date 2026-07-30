-- Add preparing_started_at column to orders table
ALTER TABLE orders ADD COLUMN preparing_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on this column
CREATE INDEX idx_orders_preparing_started_at ON orders(preparing_started_at);
