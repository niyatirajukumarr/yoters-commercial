-- Add 1 rupee test item to LETHAFI menu
INSERT INTO cafeteria_menu (cafeteria_id, name, price, category, is_available)
SELECT id, 'Test Item', 1, 'Quick Bites Veg', true
FROM cafeterias
WHERE name = 'LETHAFI'
ON CONFLICT DO NOTHING;
