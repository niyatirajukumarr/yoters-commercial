-- The Punjabi House: item-specific images for all 6 veg Biryani-category
-- dishes. From the public 'Punjabi house' storage bucket -- files listed
-- directly via the Storage API and matched 1:1 against the category's
-- dishes. Three of the six source files carry no extension in their
-- object key (e.g. "Mushroom biryani" rather than "Mushroom biryani.jpg")
-- -- that's how they were uploaded, and Supabase serves them fine by their
-- literal key regardless.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/biryani/Mushroom%20biryani'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Mushroom Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/biryani/Paneer%20mughlai'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Paneer Mughlai Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/biryani/Paneer%20tikka%20biryani'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Paneer Tikka Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/biryani/chaap%20tikka%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Chaap Tikka Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/biryani/TPH%20Special%20veg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'TPH Special Veg Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/biryani/veg%20dum%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Biryani' AND name = 'Veg Dum Biryani';
