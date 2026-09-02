-- The Punjabi House: item-specific images for 99 of 129 non-veg dishes
-- across all 8 storage folders under "non veg" (Biryani, Non veg main
-- course, Rice & noodles, Rice bowls and combos, Shake-Juice-Pasta,
-- Shawarma, Starters, Thalis and combos). From the public 'Punjabi house'
-- storage bucket -- each folder's files listed directly via the Storage
-- API and matched 1:1 against the corresponding DB dishes. The 30 dishes
-- left with placeholder images have no matching file in the bucket: Egg
-- Biryani, all 5 Egg Curries, all 9 Egg Delights, the 6 Egg-prefixed
-- Fried Rice/Noodles dishes, Egg Curry Rice Bowl, and all 8 Shawarma
-- Plate dishes.

-- Biryani
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/boneless%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Butter Chicken Boneless Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/chiken%20tikka%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Chicken Tikka Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/kolkata%20chicken%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Kolkata Chicken Dum Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/biryani%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Biryani Rice (Khuska)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/alfham%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Alfham Chicken + Biryani Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/kushka%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Khuska + Kebab (4pcs)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/grill%20chicken%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Grill Chicken Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/hyderabad%20chicken%20dum%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Hyderabadi Chicken Dum Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/chicken%20biryani%20couple%20pack.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Chicken Biryani Couple Pack (Serves 2)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/chicken%20biryani%20family%20pack.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Chicken Biryani Family Pack (Serves 3-4)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/mughlai%20chicken%20birynai.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Mughlai Chicken Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/mutton%20dum%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Mutton Dum Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/kolkata%20mutton%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Kolkata Mutton Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Biryani/tandoori%20chicken%20biryani.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Biryani' AND name = 'Tandoori Chicken Biryani';

-- Chicken Delights
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/palak%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Patiala Palak Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/dhaba%20style%20chicken%20masala.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Dhaba Chicken Masala';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/dhaba%20style%20kadai%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Dhaba Style Kadhai Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/rara%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Pind''s Fav- Rara Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/special%20chciken%20takaka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Special Chicken Takatak';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/chciken%20kohlapuri.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Chicken Kolhapuri';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/chicken%20labadar.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Mughlai Chicken Labaddar';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/afghani%20malai%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Afghani Malai Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/nawabi%20chicken%20korma.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Nawabi Chicken Korma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/chicken%20kali%20mirch.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Chicken Kali Mirch';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/signature%20delhi%20butter%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Signature Delhi Butter Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/chicken%20tikka%20masala.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Chicken Tikka Masala';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/punjabi%20chicken%20masala.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Punjabi Chicken Masala';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/home%20style%20chicken%20curry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Homestyle Chicken Curry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/tandoori%20chciekn%20masala.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Delights' AND name = 'Tandoori Chicken Masala';

-- Mutton Delights
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/mutto%20rogan%20josh.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Mutton Delights' AND name = 'Mutton Rogan Josh';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/mutton%20masala.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Mutton Delights' AND name = 'Mutton Masala';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/mutton%20kadai.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Mutton Delights' AND name = 'Mutton Kadhai';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Non%20veg%20main%20course/rara%20mutton.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Mutton Delights' AND name = 'Rara Mutton';

-- Fried Rice
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/chicken%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Fried Rice' AND name = 'Chicken Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/schezwan%20chicken%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Fried Rice' AND name = 'Schezwan Chicken Fried Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/chilli%20chicken%20fried%20rice.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Fried Rice' AND name = 'Chilli Garlic Chicken Fried Rice';

-- Noodles
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/chicken%20chowmein.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Noodles' AND name = 'Chicken Chowmein';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/chilli%20garlic%20chicken%20noodles.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Noodles' AND name = 'Chilli Garlic Chicken Noodles';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/chicken%20schezwan%20noodles.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Noodles' AND name = 'Schezwan Chicken Noodles';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20&%20noodles/chicken%20noodles.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Noodles' AND name = 'Chicken Noodles';

-- TPH Chinese Bowls / TPH Rice Bowls / TPH Signature Combos
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/chilli%20chicken%20bowl.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Chinese Bowls' AND name = 'Chilly Chicken Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/butter%20chicken%20rice%20bowl.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Rice Bowls' AND name = 'Butter Chicken Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/chicken%20curry%20rice%20bowl.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Rice Bowls' AND name = 'Chicken Curry Rice Bowl';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/chilli%20chicken%20combo.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Signature Combos' AND name = 'Chilly Chicken Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/chicken%20masala%20combo.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Signature Combos' AND name = 'Chicken Tikka Masala Combo';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Rice%20bowls%20and%20combos/butter%20chicken%20combo.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'TPH Signature Combos' AND name = 'Butter Chicken Combo';

-- Pasta / Fries
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shake-Juice-Pasta/chicken%20white%20sauce%20pasta.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Pasta' AND name = 'Chicken White Sauce Pasta';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shake-Juice-Pasta/chicken%20red%20sauce%20pasta.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Pasta' AND name = 'Chicken Red Sauce Pasta';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shake-Juice-Pasta/chicken%20mushroom%20pasta.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Pasta' AND name = 'Chicken Creamy Mushroom Pasta';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shake-Juice-Pasta/chicken%20pink%20sauce%20pasta.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Pasta' AND name = 'Chicken Pink Sauce Pasta';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shake-Juice-Pasta/chicken%20tikka%20loaded%20fries.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Fries' AND name = 'Chicken Tikka Loaded Fries';

-- Shawarma Rolls
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/arabian%20rumali%20shwarama'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Arabian Rumali Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/classic%20chicken%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Classic Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/whole%20wheat%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Whole Wheat Shawarma Roll';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/peri%20peri%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Peri-Peri Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/chipotle%20chicken%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Chipotle Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/tandoori%20chipotle%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Tandoori Chicken Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/mexican%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Mexican Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/jumbo%20shawarma'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Jumbo Shawarma';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Shawarma/chicken%20shwarama%20cheese'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Shawarma Rolls' AND name = 'Cheese Chicken Shawarma';

-- Chicken Chinese Starters
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chilli%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chilly Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/garlic%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Garlic Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20manchurian.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chicken Manchurian';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20majestic.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chicken Majestic';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%2065.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chicken 65';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20fry%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chicken Fry Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/lemon%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Lemon Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/dragon%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Dragon Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20pepper%20dry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chicken Pepper Dry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/drums%20of%20heaven'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Drums of Heaven';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20lolipop.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Lollipop (Chilly/Manchurian)';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20kali%20mirch.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Chinese Starters' AND name = 'Chicken Kali Mirch Andhra Special';

-- Chicken Soups
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20manchow%20soup.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Soups' AND name = 'Chicken Manchow Soup';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/lemon%20chicken%20corriandee%20soup'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Soups' AND name = 'Lemon Coriander Chicken Soup';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20hot%20and%20sour%20soup.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Soups' AND name = 'Chicken Hot & Sour Soup';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20clear%20soup.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Soups' AND name = 'Chicken Clear Soup';

-- Chicken Tandoori Starters
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/afghani%20malai%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Afghani Malai Chicken Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/lemon%20chicken%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Lemon Chicken Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/peri%20peri%20chicken%20tikka'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Peri Peri Chicken Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20tikka'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Chicken Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/tangri%20kebab'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Patiala Tangri Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20tangri%20kebaba.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Chicken Tangri Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20sheek%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Chicken Sheek Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20reshmi%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Chicken Reshmi Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/afghani%20tangri%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Afghani Tangri Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/chicken%20tandoori%20platter.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Chicken Tandoori Platter';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/garlic%20chicken%20tikka'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Chicken Tandoori Starters' AND name = 'Garlic Chicken Tikka';

-- Tandoori Chicken
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/peri%20peri%20tandoori%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Tandoori Chicken' AND name = 'Peri Peri Tandoori Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/lemon%20tandoori%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Tandoori Chicken' AND name = 'Lemon Tandoori Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/afghani%20malai%20tandoori%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Tandoori Chicken' AND name = 'Afghani Malai Tandoori Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/tandoori%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Tandoori Chicken' AND name = 'Tandoori Chicken';

-- Grill | Alfham
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/peri%20peri%20grill%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Grill | Alfham' AND name = 'Peri Peri Grill Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/peri%20peri%20alfham%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Grill | Alfham' AND name = 'Peri Peri Alfham Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/alfham%20chicken.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Grill | Alfham' AND name = 'Alfham Chicken';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Starters/grill%20chicken'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Grill | Alfham' AND name = 'Grill Chicken';

-- Non-Veg Thali
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Thalis%20and%20combos/non%20veg%20thali.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Non-Veg Thali' AND name = 'SPL Non-Veg Punjabi Thali';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Thalis%20and%20combos/butter%20chicken%20thali.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Non-Veg Thali' AND name = 'Butter Chicken Thali';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Thalis%20and%20combos/chicken%20masala%20thali.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Non-Veg Thali' AND name = 'Chicken Masala Thali';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/non%20veg/Thalis%20and%20combos/tandoori%20chicken%20meal.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = false AND category = 'Non-Veg Thali' AND name = 'Grill/Alfham/Tandoori Chicken Meal';
