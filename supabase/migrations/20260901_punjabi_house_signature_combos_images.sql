-- The Punjabi House: item-specific images for the 3 veg TPH Signature
-- Combos-category dishes. From the public 'Punjabi house' storage bucket —
-- files listed directly via the Storage API and matched 1:1 against the
-- category's dishes.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Signature%20combos/veg%20curry%20combo.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Signature Combos' AND name = 'Veg Curry Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Signature%20combos/khadai%20paneer%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Signature Combos' AND name = 'Kadhai Paneer Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Signature%20combos/gobi%20manchurian%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Signature Combos' AND name = 'Gobi Manchurian Combo';
