-- Move Veg Sandwich combo from Main to Combos category

UPDATE cafeteria_menu
SET category = 'Combos'
WHERE name = 'Veg Sandwich + Cold Coffee +1/2 Fries'
  AND price = 129
  AND category = 'Main';
