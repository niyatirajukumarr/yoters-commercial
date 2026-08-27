-- The Punjabi House: item-specific images for the 2 veg TPH Chinese
-- Bowls-category dishes. From the public 'Punjabi house' storage bucket —
-- files listed directly via the Storage API and matched 1:1 against the
-- category's dishes.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Chinese%20bowls/paneer%20chilly%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Chinese Bowls' AND name = 'Paneer Chilly Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Chinese%20bowls/gobi_veg%20manchurian%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Chinese Bowls' AND name = 'Gobi / Veg Manchurian Bowl';
