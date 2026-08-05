-- Add images to menu items

-- Big Deals items
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/non%20veg/Big%20Deals/Chicken%20Club%20Sandwich_Fries(0.5)_Crispy%20Wrap_Chikoo%20Shake(Jumbo).jpg'
WHERE name = 'Chicken Club Sandwich + Fries(1/2) + Crispy Wrap + Chikoo Shake(Jumbo)';

UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/veg/Big%20Deals/Fillet%20Club_Greek%20Grill_Fries(0.5)_2%20Lime.jpg'
WHERE name = 'Fillet Club + Greek Grill + Fries(1/2) + 2 Lime';

UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/non%20veg/Big%20Deals/Zinger%20Stacker_Fill%20Fat_Crinkle%20Fries_2%20Virgin%20Mojito.jpg'
WHERE name = 'Zinger Stacker + Fill Fat + Crinkle Fries + 2 Virgin Mojito';

-- Burger items
UPDATE cafeteria_menu
SET image_url = 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/veg/burgers/veg%20crunchy%20burger.png'
WHERE name = 'Veg Crunchy Burger';
