-- The Punjabi House: fix Chicken Tikka Biryani's image_url — it pointed at
-- a misspelled filename ("chiken tikka biryani.jpg") that no longer exists
-- in storage (the file was corrected to "chicken tikka biryani.jpg").

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/chicken%20tikka%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Chicken Tikka Biryani';
