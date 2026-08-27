-- The Punjabi House: item-specific images for the 6 veg TPH Rice
-- Bowls-category dishes. From the public 'Punjabi house' storage bucket —
-- files listed directly via the Storage API and matched 1:1 against the
-- category's dishes.

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/kadai%20paneer%20rice%20%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Kadhai Paneer Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/kadhi%20pakoda%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Kadhi Pakoda Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/dal%20tadka%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Dal Tadka Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/rajma%20chawal%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Rajma Chawal Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/chole%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Cholay Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/dal%20makhani%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Dal Makhani Rice Bowl';
