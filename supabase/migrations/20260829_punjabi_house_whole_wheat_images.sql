-- The Punjabi House: item-specific images for the 6 veg Whole
-- Wheat-category dishes, replacing the shared Breads category placeholder
-- set in 20260830_add_punjabi_house_item_images.sql. From the public
-- 'Punjabi house' storage bucket, same as naan/parathe/stuffed parathe.
--
-- Completes the whole "Bread's & Paratha's" page: Kulche, Naan, Parathe,
-- Stuffed Parathe, and now Whole Wheat all have item-specific photos.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/whole%20wheat/bread%20basket%20whole%20wheat.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Whole Wheat' AND name = 'Bread Basket';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/whole%20wheat/butter%20phulka%20whole%20wheat.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Whole Wheat' AND name = 'Butter Phulka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/whole%20wheat/butter%20tandoori%20roti%20whole%20wheat.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Whole Wheat' AND name = 'Butter Tandoori Roti';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/whole%20wheat/desi%20ghee%20phulka%20whole%20wheat.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Whole Wheat' AND name = 'Desi Ghee Phulka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/whole%20wheat/plain%20phulka%20whole%20wheat.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Whole Wheat' AND name = 'Plain Phulka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/whole%20wheat/plain%20tandoori%20roti%20whole%20wheat.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Whole Wheat' AND name = 'Plain Tandoori Roti';
