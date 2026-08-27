-- The Punjabi House: item-specific images for 38 veg dishes across the 4
-- categories under the "starters" storage folder (Appetizers & Soups,
-- Paneer Starters, Veg Chinese Starters, Veg Tandoor Starters). From the
-- public 'Punjabi house' storage bucket — each subfolder's files listed
-- directly via the Storage API and matched 1:1 against the category's
-- dishes. Note: "Afghani Malai Paneer Tikka" (Veg Tandoor Starters) has no
-- file in the folder and is left with its placeholder image.

-- Appetizers & Soups
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/tomato%20soup.jpeg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Tomato Soup';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/spl%20pahadi%20raita.jpeg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Spl Pahadi Raita';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/lemon%20coriander%20soup.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Lemon Coriander Soup';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/roasted_fry%20papad.png'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Roasted / Fry Papad';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/masala%20papad.jpeg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Masala Papad';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/veg%20hot%20%26%20sour.jpeg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Veg Hot & Sour Soup';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/green%20salad.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Green Salad';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/veg%20boondi%20raita.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Veg / Boondi Raita';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/appetizers%20and%20soups/veg%20manchow%20soup.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Appetizers & Soups' AND name = 'Veg Manchow Soup';

-- Paneer Starters
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/dragon%20paneer.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Dragon Paneer';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/paneer%20majestic.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Paneer Majestic';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/paneer%20pepper%20dry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Paneer Pepper Dry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/lemon%20paneer.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Lemon Paneer';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/paneer%20manchurian.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Paneer Manchurian';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/paneer%20chilly.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Paneer Chilly';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/paneer%20starters/paneer%2065.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Paneer Starters' AND name = 'Paneer 65';

-- Veg Chinese Starters
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/babycorn%20pepper%20dry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Babycorn Pepper Dry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/mushroom%20munchurian_chilli.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Mushroom Manchurian / Chilly';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/crispy%20chilli%20potato.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Crispy Chilli Potato';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/crispy%20corn.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Crispy Corn';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/babycorn%20manchurian_chilly.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Babycorn Manchurian / Chilly';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/mushroom%20pepper%20dry.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Mushroom Pepper Dry';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/gobi%20pepper%20dry_65.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Gobi Pepper Dry / 65';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/gobi%20manchurian_chilly.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Gobi Manchurian / Chilly';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/veg%20manchurian.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Veg Manchurian';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20chinese%20starters/honey%20chilli%20potato.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Chinese Starters' AND name = 'Honey Chilly Potato';

-- Veg Tandoor Starters
WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/tandoori%20mushroom.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Tandoori Mushroom';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/afghani%20malai%20soya%20chaap.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Afghani Malai Soya Chaap';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/dahi%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Dahi Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/delhi%20soya%20chaap%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Delhi Soya Chaap Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/peri%20peri%20chaap%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Peri Peri Chaap Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/lemon%20chaap%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Lemon Chaap Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/achari%20paneer%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Achari Paneer Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/lemon%20paneer%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Lemon Paneer Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/paneer%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Paneer Tikka';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/veg%20tandoori%20platter.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Veg Tandoori Platter';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/hara%20bhara%20kebab.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Hara Bhara Kebab';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/Punjabi%20house/veg/starters/veg%20tandoor/peri%20peri%20paneer%20tikka.jpg'
WHERE cafeteria_id = (SELECT id FROM cafe) AND is_veg = true AND category = 'Veg Tandoor Starters' AND name = 'Peri Peri Paneer Tikka';
