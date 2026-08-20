-- The Punjabi House non-veg starters, split into the six sections its card
-- prints. Companion to 20260817, which did the same for the veg card.
--
-- Must run after 20260816_add_punjabi_house_menu.sql, which seeds most of
-- these dishes flat under 'Starters', 'Soups' and 'Mains'.
--
-- Unlike the veg side this is not purely a re-categorisation: nine dishes on
-- the card were missing from the app entirely — Peri Peri Chicken Tikka, the
-- four Tandoori Chicken portions and the four Grill | Alfham portions.
--
-- The six categories are grouped behind one "Starters" pill by CATEGORY_GROUPS
-- in app/mobile/order/[cafeteriaId]/page.tsx. Renaming one here without
-- updating that list would scatter the section into six top-level pills.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
begin

  -- 1. Dishes on the card that the app never had -----------------------------
  insert into cafeteria_menu (cafeteria_id, name, price, category, is_veg, is_available, variants)
  values
    (pj, 'Peri Peri Chicken Tikka', 129, 'Chicken Tandoori Starters', false, true,
     '[{"name":"Qtr (4pc)","price":129},{"name":"Half (6pc)","price":189},{"name":"Full (8pc)","price":235}]'::jsonb),
    (pj, 'Tandoori Chicken', 119, 'Tandoori Chicken', false, true,
     '[{"name":"Qtr","price":119},{"name":"Half","price":219},{"name":"Full","price":419}]'::jsonb),
    (pj, 'Peri Peri Tandoori Chicken', 129, 'Tandoori Chicken', false, true,
     '[{"name":"Qtr","price":129},{"name":"Half","price":229},{"name":"Full","price":429}]'::jsonb),
    (pj, 'Afghani Malai Tandoori Chicken', 135, 'Tandoori Chicken', false, true,
     '[{"name":"Qtr","price":135},{"name":"Half","price":239},{"name":"Full","price":439}]'::jsonb),
    (pj, 'Lemon Tandoori Chicken', 135, 'Tandoori Chicken', false, true,
     '[{"name":"Qtr","price":135},{"name":"Half","price":239},{"name":"Full","price":439}]'::jsonb),
    (pj, 'Grill Chicken', 109, 'Grill | Alfham', false, true,
     '[{"name":"Qtr","price":109},{"name":"Half","price":209},{"name":"Full","price":399}]'::jsonb),
    (pj, 'Peri Peri Grill Chicken', 119, 'Grill | Alfham', false, true,
     '[{"name":"Qtr","price":119},{"name":"Half","price":219},{"name":"Full","price":419}]'::jsonb),
    (pj, 'Alfham Chicken', 129, 'Grill | Alfham', false, true,
     '[{"name":"Qtr","price":129},{"name":"Half","price":229},{"name":"Full","price":429}]'::jsonb),
    (pj, 'Peri Peri Alfham Chicken', 135, 'Grill | Alfham', false, true,
     '[{"name":"Qtr","price":135},{"name":"Half","price":239},{"name":"Full","price":439}]'::jsonb)
  on conflict do nothing;

  -- 2. Sections ---------------------------------------------------------------
  update cafeteria_menu set category = 'Chicken Tandoori Starters'
  where cafeteria_id = pj and is_veg = false and name in (
    'Chicken Tikka', 'Peri Peri Chicken Tikka', 'Afghani Malai Chicken Tikka',
    'Garlic Chicken Tikka', 'Lemon Chicken Tikka', 'Chicken Sheek Kebab',
    'Chicken Reshmi Kebab', 'Chicken Tangri Kebab', 'Patiala Tangri Kebab',
    'Afghani Tangri Kebab', 'Chicken Tandoori Platter'
  );

  update cafeteria_menu set category = 'Chicken Chinese Starters'
  where cafeteria_id = pj and is_veg = false and name in (
    'Drums of Heaven', 'Lollipop (Chilly/Manchurian)', 'Chicken Kali Mirch Andhra Special',
    'Dragon Chicken', 'Chicken Majestic', 'Chilly Chicken', 'Chicken Manchurian',
    'Lemon Chicken', 'Chicken 65', 'Chicken Pepper Dry', 'Garlic Chicken', 'Chicken Fry Kebab'
  );

  update cafeteria_menu set category = 'Chicken Soups'
  where cafeteria_id = pj and is_veg = false and name in (
    'Chicken Manchow Soup', 'Chicken Hot & Sour Soup', 'Chicken Clear Soup',
    'Lemon Coriander Chicken Soup'
  );

  update cafeteria_menu set category = 'Egg Delights'
  where cafeteria_id = pj and is_veg = false and name in (
    'Egg Chilly', 'Egg Manchurian', 'Egg Pepper Dry', 'Egg 65', 'Egg Bhurji',
    'Masala Omelette', 'Plain Omelette', 'Masala Boiled Eggs', 'Boiled Eggs'
  );

  -- 3. Portion pricing on dishes that already existed -------------------------
  -- The stored price was whichever column the seeder happened to take; it is
  -- now the cheapest option, matching the Half/Full convention.
  update cafeteria_menu set price = 119, variants =
    '[{"name":"Qtr (4pc)","price":119},{"name":"Half (6pc)","price":179},{"name":"Full (8pc)","price":219}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Tikka';

  update cafeteria_menu set price = 135, variants =
    '[{"name":"Qtr (4pc)","price":135},{"name":"Half (6pc)","price":195},{"name":"Full (8pc)","price":245}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Afghani Malai Chicken Tikka';

  update cafeteria_menu set price = 135, variants =
    '[{"name":"Qtr (4pc)","price":135},{"name":"Half (6pc)","price":189},{"name":"Full (8pc)","price":239}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Garlic Chicken Tikka';

  update cafeteria_menu set price = 135, variants =
    '[{"name":"Qtr (4pc)","price":135},{"name":"Half (6pc)","price":195},{"name":"Full (8pc)","price":245}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Lemon Chicken Tikka';

  update cafeteria_menu set price = 119, variants =
    '[{"name":"Qtr (4pc)","price":119},{"name":"Half (6pc)","price":179},{"name":"Full (8pc)","price":219}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Sheek Kebab';

  -- The tangri kebabs are sold by the piece, not by the quarter.
  update cafeteria_menu set price = 149, variants =
    '[{"name":"2pcs","price":149},{"name":"4pcs","price":279}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Tangri Kebab';

  update cafeteria_menu set price = 169, variants =
    '[{"name":"2pcs","price":169},{"name":"4pcs","price":319}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Patiala Tangri Kebab';

  update cafeteria_menu set price = 165, variants =
    '[{"name":"2pcs","price":165},{"name":"4pcs","price":309}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Afghani Tangri Kebab';

  -- Chicken Reshmi Kebab (₹249) and Chicken Tandoori Platter (₹659) carry one
  -- price against no portion, so they stay flat.

  -- The card prints this one as "79/159" with no sizes against the two
  -- figures, so the options are named by their own prices. The names must stay
  -- distinct even so: cart lines key on the variant name, and two blank names
  -- would merge the two choices into one line at one price.
  update cafeteria_menu set price = 79, variants =
    '[{"name":"₹79","price":79},{"name":"₹159","price":159}]'::jsonb
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Fry Kebab';

  -- 4. What the card prints under a dish name --------------------------------
  update cafeteria_menu set description =
    'Chicken Tikka - 3pcs, Malai Chicken Tikka - 3pcs, Lemon Chicken Tikka - 3pcs, Tandoori Chicken - 2pcs, Seekh Kebab - 3pcs, Tangri Kebab - 2pcs'
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Tandoori Platter';

  update cafeteria_menu set description = '3 eggs'
  where cafeteria_id = pj and is_veg = false and name = 'Egg Bhurji';
  update cafeteria_menu set description = '2 eggs'
  where cafeteria_id = pj and is_veg = false and name in ('Masala Omelette', 'Masala Boiled Eggs');
  update cafeteria_menu set description = '2 pcs'
  where cafeteria_id = pj and is_veg = false and name = 'Boiled Eggs';

  -- The card prices the plain omelette at ₹59, not the ₹49 seeded.
  update cafeteria_menu set price = 59
  where cafeteria_id = pj and is_veg = false and name = 'Plain Omelette';

  -- 5. Boneless Chicken Tikka appears on none of the six cards; removed at the
  -- owner's instruction. No order referenced it.
  delete from cafeteria_menu
  where cafeteria_id = pj and is_veg = false and name = 'Boneless Chicken Tikka';

end $$;
