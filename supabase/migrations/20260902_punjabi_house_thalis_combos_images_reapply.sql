-- The Punjabi House: item-specific images for 11 veg dishes across the 2
-- categories under the "thali's and combos" storage folder (Punjabi
-- Mania, Veg Thali). These were wiped back to null by an earlier revert
-- -- reapplied from the public 'Punjabi house' storage bucket, same
-- mapping as the original 20260901 migration.

-- Punjabi Mania
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/delhi%20chole%20bhature%20(2pc).jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Delhi Cholay Bhature (2 pcs)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/amritsari%20aloo%20kulcha%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Amritsari Aloo Kulcha Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/paneer%20chur-chur%20naan%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Paneer Chur-Chur Naan Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/poori%20sabji%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Poori Sabji Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/aloo%20pyaaz%20chur%20chur%20naan.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Aloo Pyaaz Chur-Chur Naan';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/chaap%20tikka%20rumali%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Chaap Tikka Rumali Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/punjabi%20mania/aloo%20paratha%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Punjabi Mania' AND name = 'Aloo Paratha Combo';

-- Veg Thali
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/veg%20thali/SPL%20veg%20punjabi%20thali.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Thali' AND name = 'SPL Veg Punjabi Thali';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/veg%20thali/gobi%20manchurian%20thali.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Thali' AND name = 'Gobi Manchurian Thali';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/veg%20thali/Cholay_Rajma%20Thali.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Thali' AND name = 'Cholay/Rajma Thali';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/thali''s%20and%20combos/veg%20thali/premiumveg%20thali.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Thali' AND name = 'Premium Veg Thali';
