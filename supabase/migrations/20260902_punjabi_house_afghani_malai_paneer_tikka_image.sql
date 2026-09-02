-- The Punjabi House: add the missing image for Afghani Malai Paneer Tikka
-- (Veg Tandoor Starters), the one dish left without a photo after the
-- starters image batch.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/afghani%20malai%20paneer%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Afghani Malai Paneer Tikka';
