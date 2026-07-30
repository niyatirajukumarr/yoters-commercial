-- Update Loaded Lethafi Fries to Quick Bites Non Veg category
UPDATE cafeteria_menu
SET category = 'Quick Bites Non Veg'
WHERE name = 'Loaded Lethafi Fries'
AND cafeteria_id = (SELECT id FROM cafeterias WHERE name = 'LETHAFI');
