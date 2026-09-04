-- The Punjabi House: fix Shawarma Rolls image URLs (files moved into a
-- 'shawarma' subfolder, breaking the old flat paths) and add the previously
-- missing Shawarma Plate images (8 dishes), from the public 'Punjabi house'
-- storage bucket's 'non veg/Shawarma' folder.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/arabian%20rumali%20shwarama'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Arabian Rumali Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/chicken%20shwarama%20cheese'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Cheese Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/chipotle%20chicken%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Chipotle Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/classic%20chicken%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Classic Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/jumbo%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Jumbo Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/mexican%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Mexican Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/peri%20peri%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Peri-Peri Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/tandoori%20chipotle%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Tandoori Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma/whole%20wheat%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Whole Wheat Shawarma Roll';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/arabian%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Arabian Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/cheese%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Cheese Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/chipotle%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Chipotle Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/classic%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Classic Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/mexican%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Mexican Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/peri%20peri%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Peri-Peri Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/tandoori%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Tandoori Shawarma Plate';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/shawarma%20plate/whole%20wheat%20shawarma%20plate.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Plate' AND name = 'Whole Wheat Shawarma Plate';
