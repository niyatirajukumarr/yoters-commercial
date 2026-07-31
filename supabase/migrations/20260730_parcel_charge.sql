-- Add parcel_charge column to orders table
-- Parcel charge: ₹5 for takeaway and delivery orders, ₹0 for dine_in
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS parcel_charge numeric(10,2) DEFAULT 0;
