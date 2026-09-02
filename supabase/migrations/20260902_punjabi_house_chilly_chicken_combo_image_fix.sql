-- The Punjabi House: fix Chilly Chicken Combo's image_url — the storage
-- file was renamed (spelling "chilli" -> "chilly", extension .jpg -> .png),
-- leaving the old URL broken.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/chilly%20chicken%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Signature Combos' AND name = 'Chilly Chicken Combo';
