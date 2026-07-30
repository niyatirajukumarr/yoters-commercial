-- Add 1 rupee test item to LETHAFI menu
INSERT INTO menu_items (cafeteria_id, name, price, category, is_available, is_veg, description)
SELECT id, 'Test Item', 1, 'Quick Bites Veg', true, true, 'Temporary test item'
FROM cafeterias
WHERE name = 'LETHAFI'
LIMIT 1;
