-- Add Big Deals category and items to Lethafi cafeteria

-- Get cafeteria ID for Lethafi
WITH caf AS (
  SELECT id FROM cafeterias WHERE name ILIKE '%lethafi%' LIMIT 1
)
INSERT INTO cafeteria_menu (cafeteria_id, name, description, price, category, is_veg, is_available)
SELECT
  caf.id,
  deal.name,
  deal.description,
  deal.price,
  'Big Deals',
  deal.is_veg,
  true
FROM caf
CROSS JOIN (
  VALUES
    ('Chicken Club Sandwich + Fries(1/2) + Crispy Wrap + Chikoo Shake(Jumbo)', 'Premium chicken club combo with fries, crispy wrap and chikoo shake', 299, false),
    ('Fillet Club + Greek Grill + Fries(1/2) + 2 Lime', 'Delicious fillet club with Greek grill, fries and lime', 349, false),
    ('Zinger Stacker + Fill Fat + Crinkle Fries + 2 Virgin Mojito', 'Spicy zinger stacker with fill fat, crinkle fries and virgin mojitos', 399, false)
) AS deal(name, description, price, is_veg);
