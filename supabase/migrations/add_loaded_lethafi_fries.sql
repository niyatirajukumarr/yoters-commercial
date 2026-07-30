-- Add Loaded Lethafi Fries under Quick Bites
INSERT INTO cafeteria_menu (cafeteria_id, name, category, price, is_available)
SELECT
  id,
  'Loaded Lethafi Fries' AS name,
  'Quick Bites' AS category,
  150 AS price,
  true AS is_available
FROM cafeterias
WHERE name = 'LETHAFI'
ON CONFLICT DO NOTHING;
