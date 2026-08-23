-- The Punjabi House "Shake - Juice - Pasta" page: seven sections split out of
-- the catch-all categories they had been seeded into. Almost entirely a
-- re-categorisation — only two dishes were missing.
--
-- Where they came from:
--   Beverages (22) -> Shakes, Juice, Signature Shake, Mojitos   (empties)
--   Sides (5)      -> Fries                                     (empties)
--   Desserts (13)  -> Ice Cream takes 6, 7 stay put
--   Pasta          -> stays, but re-priced and completed
--
-- The seven veg sections group behind one "Shake - Juice - Pasta" pill via
-- CATEGORY_GROUPS in app/mobile/order/[cafeteriaId]/page.tsx. That group is
-- scoped to this restaurant and to the veg side, and both halves of the
-- scoping are load-bearing:
--
--   * 'Mojitos' is also a drinks category at LETHAFI, where it belongs to the
--     "Beverages and Delights" group. Without the restaurant scope one of the
--     two groups would swallow the other's category.
--   * 'Pasta' exists on both sides of the veg toggle here. Only the veg one is
--     part of this section; the chicken pasta is a top-level category on the
--     non-veg side.
--
-- Two dishes on this page are chicken and cannot sit in the veg section, so
-- they live in non-veg categories of the same name: Chicken Tikka Loaded Fries
-- under 'Fries', and the four chicken pastas under 'Pasta'.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
begin

  update cafeteria_menu set category = 'Shakes'
  where cafeteria_id = pj and is_veg = true and name in (
    'Mango Milkshake', 'Banana Milkshake', 'Strawberry Milkshake', 'Rose Milkshake',
    'Badam Milkshake', 'Pista Milkshake', 'Dry Fruit Milkshake', 'Blueberry Milkshake'
  );

  update cafeteria_menu set category = 'Juice'
  where cafeteria_id = pj and is_veg = true and name in (
    'Pineapple', 'Watermelon', 'Lime Soda', 'Mint Lime', 'Orange', 'Mosambi'
  );

  update cafeteria_menu set category = 'Signature Shake'
  where cafeteria_id = pj and is_veg = true and name in (
    'Cold Coffee', 'Pina Colada', 'Fruit Punch', 'Nutella', 'Oreo'
  );

  update cafeteria_menu set category = 'Mojitos'
  where cafeteria_id = pj and is_veg = true and name in (
    'Virgin Mojito', 'Blue Sea Lime', 'Fresh Lime'
  );

  -- Six of the thirteen desserts are the ice cream list; the rest stay.
  update cafeteria_menu set category = 'Ice Cream'
  where cafeteria_id = pj and is_veg = true and name in (
    'Butter Scotch', 'Strawberry', 'Chocolate', 'Vanilla', 'Black Currant', 'Mango'
  );

  update cafeteria_menu set category = 'Fries'
  where cafeteria_id = pj and is_veg = true and name in (
    'Salted Fries', 'Peri Peri Fries', 'Cheesy Fries', 'Paneer Tikka Loaded Fries'
  );

  -- Printed in the same list, but it is chicken, so it belongs on the other
  -- side of the veg toggle.
  update cafeteria_menu set category = 'Fries'
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Tikka Loaded Fries';

  -- The pasta rows had been seeded from the card's CHICKEN column, so every veg
  -- pasta was priced ₹20 over the veg column it should have taken, and both
  -- chicken pastas carried the creamy mushroom price.
  update cafeteria_menu set price = 159 where cafeteria_id = pj and is_veg = true and name = 'White Sauce Pasta';
  update cafeteria_menu set price = 159 where cafeteria_id = pj and is_veg = true and name = 'Red Sauce Pasta';
  update cafeteria_menu set price = 169 where cafeteria_id = pj and is_veg = true and name = 'Pink Sauce Pasta';
  update cafeteria_menu set price = 179 where cafeteria_id = pj and is_veg = true and name = 'Creamy Mushroom Pasta';
  update cafeteria_menu set price = 179 where cafeteria_id = pj and is_veg = false and name = 'Chicken White Sauce Pasta';
  update cafeteria_menu set price = 179 where cafeteria_id = pj and is_veg = false and name = 'Chicken Red Sauce Pasta';

  -- Two of the four chicken pastas were never seeded.
  insert into cafeteria_menu (cafeteria_id, name, price, category, is_veg, is_available, variants)
  values
    (pj, 'Chicken Pink Sauce Pasta', 189, 'Pasta', false, true, '[]'::jsonb),
    (pj, 'Chicken Creamy Mushroom Pasta', 199, 'Pasta', false, true, '[]'::jsonb)
  on conflict do nothing;

end $$;
