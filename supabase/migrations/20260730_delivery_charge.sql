-- Add delivery_charge column to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_charge numeric(10,2) DEFAULT 0;

-- Add coordinates to cafeterias table for distance calculation
ALTER TABLE cafeterias
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
