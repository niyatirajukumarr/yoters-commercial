-- Rename Main category to Combos for Lethafi cafeteria
-- Remove separate Combos category items

UPDATE cafeteria_menu
SET category = 'Combos'
WHERE category = 'Main'
  AND cafeteria_id = (SELECT id FROM cafeterias WHERE vendor_email = 'lethafi@yoters.com');

-- Delete the separate Combos category items (keep only Main renamed to Combos)
DELETE FROM cafeteria_menu
WHERE category = 'Combos'
  AND cafeteria_id = (SELECT id FROM cafeterias WHERE vendor_email = 'lethafi@yoters.com')
  AND name NOT LIKE '%Veg Sandwich + Cold Coffee%';
