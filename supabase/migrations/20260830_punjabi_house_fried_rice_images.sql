-- The Punjabi House: item-specific images for the 6 veg Fried
-- Rice-category dishes, replacing the shared Rice category placeholder set
-- in 20260830_add_punjabi_house_item_images.sql. From the public
-- 'Punjabi house' storage bucket.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/fried%20rice/chilli%20garlic%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Fried Rice' AND name = 'Chilli Garlic Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/fried%20rice/gobi%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Fried Rice' AND name = 'Gobi Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/fried%20rice/manchurian%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Fried Rice' AND name = 'Manchurian Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/fried%20rice/mushroom%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Fried Rice' AND name = 'Mushroom Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/fried%20rice/paneer%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Fried Rice' AND name = 'Paneer Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/fried%20rice/veg%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Fried Rice' AND name = 'Veg Fried Rice';
