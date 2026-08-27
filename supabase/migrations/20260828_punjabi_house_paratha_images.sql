-- The Punjabi House: item-specific images for the 5 veg Parathe-category
-- dishes, replacing the shared Breads category placeholder set in
-- 20260830_add_punjabi_house_item_images.sql. From the now-public
-- 'Punjabi house' storage bucket, same as the naan images.
--
-- 'Kerela Paratha' is the DB's established (mis)spelling — the source file
-- is 'Kerala Paratha.jpg', but the row itself is named without the 'a'.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/parathe/ajwain%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Parathe' AND name = 'Ajwain Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/parathe/garlic%20laccha%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Parathe' AND name = 'Garlic Laccha Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/parathe/Kerala%20Paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Parathe' AND name = 'Kerela Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/parathe/SPL%20Laccha%20Paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Parathe' AND name = 'SPL Laccha Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/parathe/tawa%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Parathe' AND name = 'Tawa Paratha';
