-- Remove 1 rupee demo item from Lit Bites Prof's Cafe
DELETE FROM cafeteria_menu
WHERE cafeteria_id = (
  SELECT id FROM cafeterias WHERE name = 'Lit Bites Prof''s Cafe'
)
AND name = 'Biryani Sample'
AND price = 1.00;
