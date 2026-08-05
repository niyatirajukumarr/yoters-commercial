-- Add delivery_available flag to cafeterias table
ALTER TABLE cafeterias
  ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT true;

-- Update existing cafeterias to have delivery enabled
UPDATE cafeterias SET delivery_available = true WHERE delivery_available IS NULL;

-- Verify the column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'cafeterias'
AND column_name = 'delivery_available';
