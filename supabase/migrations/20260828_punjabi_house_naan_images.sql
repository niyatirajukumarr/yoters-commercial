-- The Punjabi House: item-specific images for all 7 veg Naan dishes,
-- replacing the shared Breads category placeholder set in
-- 20260830_add_punjabi_house_item_images.sql.
--
-- Unlike the earlier per-dish image migrations (biryani, kulcha), these come
-- from a public bucket ('Punjabi house' storage bucket switched from private
-- to public) rather than a signed URL with a token — no expiry to worry
-- about, and no long-dated token embedded in the migration.
--
-- Note: 'Aloo Pyaaz Chur Chur Naan' (category 'Naan') is a distinct dish
-- from 'Aloo Pyaaz Chur-Chur Naan' (category 'Punjabi Mania', a combo) —
-- same name minus the hyphen, different row. Only the 'Naan'-category one
-- is a plain naan; the hyphenated one keeps its existing image.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/aloo%20pyaaz%20chur%20chur%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Aloo Pyaaz Chur Chur Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/butter%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Butter Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/cheese%20garlic%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Cheese Garlic Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/cheese%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Cheese Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/garlic%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Garlic Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/paneer%20chur%20chur%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Paneer Chur Chur Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/bread''s%20and%20paratha''s/naan/plain%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Naan' AND name = 'Plain Naan';
