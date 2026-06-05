-- Add image_url column to cafeterias table
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Update Lit Bites with the image URL
UPDATE cafeterias
SET image_url = 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/cafeteria-images/public/lit-bites-prof-cafe.webp'
WHERE name = 'Lit Bites Prof''s Cafe';
