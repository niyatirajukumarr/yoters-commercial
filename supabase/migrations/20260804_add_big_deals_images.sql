-- Add images to Big Deals items and other burgers

-- Chicken Club Sandwich
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/non%20veg/Big%20Deals/Chicken%20Club%20Sandwich_Fries(0.5)_Crispy%20Wrap_Chikoo%20Shake(Jumbo).jpg'
WHERE name LIKE '%Chicken Club Sandwich%' AND category = 'Big Deals';

-- Zinger Stacker
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/non%20veg/Big%20Deals/Zinger%20Stacker_Fill%20Fat_Crinkle%20Fries_2%20Virgin%20Mojito.jpg'
WHERE name LIKE '%Zinger Stacker%' AND category = 'Big Deals';

-- Fillet Club
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/veg/Big%20Deals/Fillet%20Club_Greek%20Grill_Fries(0.5)_2%20Lime.jpg'
WHERE name LIKE '%Fillet Club%' AND category = 'Big Deals';

-- Veg Crunchy Burger
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/veg/burgers/veg%20crunchy%20burger.png'
WHERE name LIKE '%Veg Crunchy Burger%' AND category = 'Burgers' AND is_veg = true;

-- Chicken Nuggets Burger
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/non%20veg/burgers/chicken%20nuggets%20burger.jpg'
WHERE name LIKE '%Chicken Nuggets Burger%' AND category = 'Burgers';

-- Chicken Roll
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/non%20veg/rolls/Chicken%20Roll.jpg'
WHERE name LIKE '%Chicken Roll%' AND category = 'Rolls';
