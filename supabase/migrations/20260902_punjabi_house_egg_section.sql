-- The Punjabi House: create a flat "Egg" category out of every egg dish,
-- which previously lived scattered across 'Egg Curries', 'Egg Delights',
-- and Egg-prefixed items inside 'Fried Rice', 'Noodles', 'Biryani', and
-- 'TPH Rice Bowls'. All 22 dishes move to category = 'Egg' (no
-- subcategories) and get item-specific images from the public
-- 'Punjabi house' storage bucket's 'egg' folder, matched 1:1 by name.
-- Pairs with a frontend change adding a third Egg tab alongside Veg /
-- Non-Veg on the customer order page.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20kohlapuri.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Kolhapuri';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20kadhai.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Kadhai';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20curry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Curry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/dhaba%20egg.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Dhaba Egg Masala';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20punjabi%20masala.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Punjabi Masala';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/plain%20omelet.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Plain Omelette';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/masala%20omeltee.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Masala Omelette';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/boiled%20eggs.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Boiled Eggs';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20burji.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Bhurji';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%2065.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg 65';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/masala%20boiled%20eggs.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Masala Boiled Eggs';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20chilli.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Chilly';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20pepper%20dry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Pepper Dry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20manchurian.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Manchurian';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20chilli%20garlic%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Chilli Garlic Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20schzwan%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Schezwan Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20chilli%20garlic%20noodles.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Chilli Garlic Noodles';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20noodles.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Noodles';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20schezwan%20noodles.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Schezwan Noodles';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET category = 'Egg', image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/egg/egg%20curry%20rice%20bowl.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND name = 'Egg Curry Rice Bowl';
