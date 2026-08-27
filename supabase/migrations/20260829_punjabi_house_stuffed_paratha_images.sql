-- The Punjabi House: item-specific images for the 5 veg Stuffed
-- Parathe-category dishes, replacing the shared Breads category
-- placeholder set in 20260830_add_punjabi_house_item_images.sql. From the
-- public 'Punjabi house' storage bucket, same as naan/parathe.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/stuffed%20parathe/aloo%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Stuffed Parathe' AND name = 'Aloo Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/stuffed%20parathe/aloo%20pyaaz%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Stuffed Parathe' AND name = 'Aloo Pyaaz Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/stuffed%20parathe/gobi%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Stuffed Parathe' AND name = 'Gobi Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/stuffed%20parathe/paneer%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Stuffed Parathe' AND name = 'Paneer Paratha';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/stuffed%20parathe/pyaaz%20paratha.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Stuffed Parathe' AND name = 'Pyaaz Paratha';
