-- Add remaining 7 combos to Lethafi cafeteria

INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_veg, is_available)
SELECT
  c.id,
  v.name,
  v.description,
  v.price,
  'Combos',
  v.is_veg,
  true
FROM cafeterias c
CROSS JOIN (
  VALUES
    ('Chicken Burger + Virgin Mojito+1/2 Fries', 'Juicy chicken burger with mojito and fries', 139, false),
    ('Fillet Sandwich + Lime • Onion Rings', 'Crispy fillet sandwich with onion rings', 149, false),
    ('Zinger Burger + Watermelon + Nuggets', 'Spicy zinger burger with watermelon and nuggets', 159, false),
    ('Chicken Strips + 2 Mayo Bun + 2 Blue Soda', 'Crispy chicken strips with mayo buns and soda', 169, false),
    ('Chicken Sandwich + Oreo Shake + Lays Bun + Fries', 'Chicken sandwich with oreo shake and fries', 179, false),
    ('Fries 1/2 + Crinkle Fries 1/2 + Finger Chicken + Watermelon Juice', 'Mix of fries, chicken, and watermelon juice', 189, false),
    ('Zinger Burger + Strips 2pcs + Fries 1/2 + Mint Soda', 'Zinger burger with chicken strips and mint soda', 199, false)
) AS v(name, description, price, is_veg)
WHERE c.vendor_email = 'lethafi@yoters.com';
