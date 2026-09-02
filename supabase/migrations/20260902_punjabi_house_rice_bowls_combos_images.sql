-- The Punjabi House: item-specific images for all 18 veg dishes across the
-- 4 categories under the "rice bowls and combos" storage folder
-- (Refreshment's, TPH Chinese Bowls, TPH Rice Bowls, TPH Signature
-- Combos). From the public 'Punjabi house' storage bucket -- each
-- subfolder's files listed directly via the Storage API and matched 1:1
-- against the category's dishes. Reapplies image URLs that were wiped by
-- an earlier revert of a broader fuzzy-matching image script.

-- Refreshment's
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/butter%20milk.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Butter Milk';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/choco%20lava%20cake.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Choco Lava Cake';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/gulab%20jamun%20(2pc).jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Gulab Jamun (2 pcs)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/matka%20rabdi.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Matka Rabdi';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/punjabi%20sweet%20lassi.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Punjabi Sweet Lassi';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/rasmalai.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Rasmalai';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/Refreshments/walnut%20brownies.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Refreshment''s' AND name = 'Walnut Brownie';

-- TPH Chinese Bowls
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Chinese%20bowls/gobi_veg%20manchurian%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Chinese Bowls' AND name = 'Gobi / Veg Manchurian Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Chinese%20bowls/paneer%20chilly%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Chinese Bowls' AND name = 'Paneer Chilly Bowl';

-- TPH Rice Bowls
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/chole%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Cholay Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/dal%20makhani%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Dal Makhani Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/dal%20tadka%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Dal Tadka Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/kadai%20paneer%20rice%20%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Kadhai Paneer Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/kadhi%20pakoda%20rice%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Kadhi Pakoda Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20rice%20bowls/rajma%20chawal%20bowl.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Rice Bowls' AND name = 'Rajma Chawal Bowl';

-- TPH Signature Combos
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Signature%20combos/gobi%20manchurian%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Signature Combos' AND name = 'Gobi Manchurian Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Signature%20combos/khadai%20paneer%20combo.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Signature Combos' AND name = 'Kadhai Paneer Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/rice%20bowls%20and%20combos/TPH%20Signature%20combos/veg%20curry%20combo.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'TPH Signature Combos' AND name = 'Veg Curry Combo';
