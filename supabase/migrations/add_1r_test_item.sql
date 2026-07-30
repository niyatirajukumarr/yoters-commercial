-- Add 1 rupee test item to LETHAFI menu
INSERT INTO cafeteria_menu (cafeteria_id, name, price, category, is_available, is_veg)
SELECT id, 'Test Item', 1, 'Quick Bites Veg', true, true
FROM cafeterias
WHERE name = 'LETHAFI'
ON CONFLICT DO NOTHING;
