-- The Punjabi House: item-specific images for all 7 veg Refreshment's-
-- category dishes, replacing the shared Desserts category placeholders set
-- in 20260830_add_punjabi_house_item_images.sql. From the public
-- 'Punjabi house' storage bucket — listed directly via the Storage API
-- rather than pasted one by one, since the folder's 7 files matched the
-- category's 7 dishes exactly.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/butter%20milk.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Butter Milk';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/choco%20lava%20cake.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Choco Lava Cake';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/gulab%20jamun%20(2pc).jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Gulab Jamun (2 pcs)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/matka%20rabdi.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Matka Rabdi';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/punjabi%20sweet%20lassi.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Punjabi Sweet Lassi';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/rasmalai.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Rasmalai';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/walnut%20brownies.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Walnut Brownie';
