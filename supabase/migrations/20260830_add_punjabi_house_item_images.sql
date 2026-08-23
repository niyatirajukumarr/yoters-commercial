-- Add images to The Punjabi House menu items
WITH cafe AS (
  SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1
)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1626082927389-6cd097cda1ec?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND name IN ('Paneer Tikka', 'Peri Peri Paneer Tikka', 'Afghani Malai Paneer Tikka', 'Achari Paneer Tikka', 'Lemon Paneer Tikka', 'Lemon Chaap Tikka', 'Peri Peri Chaap Tikka', 'Delhi Soya Chaap Tikka', 'Afghani Malai Soya Chaap', 'Dahi Kebab', 'Veg Tandoori Platter', 'Paneer Chilly', 'Paneer Manchurian', 'Dragon Paneer', 'Paneer Majestic', 'Paneer Pepper Dry', 'Paneer 65', 'Lemon Paneer');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1599603810694-e6e99eaf27fa?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND name IN ('Tandoori Mushroom', 'Hara Bhara Kebab', 'Honey Chilly Potato', 'Crispy Corn', 'Veg Manchurian', 'Crispy Chilli Potato');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND name IN ('Chicken Tikka', 'Boneless Chicken Tikka', 'Afghani Malai Chicken Tikka', 'Garlic Chicken Tikka', 'Lemon Chicken Tikka', 'Chicken Sheek Kebab', 'Chicken Reshmi Kebab', 'Chicken Tangri Kebab', 'Patiala Tangri Kebab', 'Afghani Tangri Kebab');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND name IN ('Egg Chilly', 'Egg Manchurian', 'Egg Pepper Dry', 'Egg 65', 'Egg Bhurji', 'Masala Omelette', 'Plain Omelette', 'Masala Boiled Eggs', 'Boiled Eggs');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1601050915917-f3f88e0055be?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND (category = 'Mains');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1596379957409-a3a5c67df32f?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Breads';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1585521537196-7b0de6c7fbe8?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Breads' AND name LIKE '%Naan%';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Rice';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1609501676725-7186f017a4b2?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Rice' AND (name LIKE '%Fried%' OR name LIKE '%Rice%');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1589301760014-d929314c3fe6?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Biryani';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Combos';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Sides';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1621996346565-431f63602f41?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Pasta';

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Desserts' AND (name LIKE '%Lassi%' OR name = 'Butter Milk');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Desserts' AND (name LIKE '%Cake%' OR name LIKE '%Brownie%');

WITH cafe AS (SELECT id FROM cafeterias WHERE name = 'The Punjabi House' LIMIT 1)
UPDATE cafeteria_menu SET image_url = 'https://images.unsplash.com/photo-1551632440-e5e89f63c076?w=200&h=200&fit=crop' WHERE cafeteria_id = (SELECT id FROM cafe) AND category = 'Desserts';
