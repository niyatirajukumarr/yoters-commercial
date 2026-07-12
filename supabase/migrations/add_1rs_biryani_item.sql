-- Add 1 rupee biryani item to Lit Bites Prof's Cafe
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_available)
SELECT
  id,
  'Biryani Sample' AS name,
  'Complimentary tasting portion' AS description,
  1.00 AS price,
  'Biryani' AS category,
  true AS is_available
FROM cafeterias
WHERE name = 'Lit Bites Prof''s Cafe'
ON CONFLICT DO NOTHING;
