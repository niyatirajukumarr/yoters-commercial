-- The Punjabi House: item-specific images for the 10 veg Rice
-- Variety-category dishes, replacing the shared Rice category placeholder
-- set in 20260830_add_punjabi_house_item_images.sql. From the public
-- 'Punjabi house' storage bucket. Completes the "Rice & Noodles" page
-- (Fried Rice, Noodles, Rice Variety).

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/curd%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Curd Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/dal%20khichdi.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Dal Khichdi';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/ghee%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Ghee Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/green%20peas%20pulav.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Green Peas Pulav';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/jeera%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Jeera Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/masala%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Masala Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/palak%20khichdi.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Palak Khichdi';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/paneer%20pulav.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Paneer Pulav';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/steam%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Steam Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20and%20noodles/rice%20variety/veg%20pulav.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Rice Variety' AND name = 'Veg Pulav';
