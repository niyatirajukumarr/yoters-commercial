-- Add image to Lethafi Madness special shake

UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/veg/special%20shakes/lethafi%20madness.jpeg'
WHERE name = 'Lethafi Madness' AND category = 'Special Shakes';
