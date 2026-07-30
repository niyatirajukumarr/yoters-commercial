-- Remove Demo Item from LETHAFI menu
DELETE FROM cafeteria_menu
WHERE cafeteria_id = (
  SELECT id FROM cafeterias WHERE name = 'LETHAFI'
)
AND name = 'Demo Item'
AND price = 1.00;
