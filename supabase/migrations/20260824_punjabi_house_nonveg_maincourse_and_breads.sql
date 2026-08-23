-- Two more Punjabi House pages: "Non Veg Main Course" (Chicken Delights, Egg
-- Curries, Mutton Delights) and "Bread's & Paratha's" (Whole Wheat, Parathe,
-- Naan, Kulche, Stuffed Parathe). Carved out of the 24-dish non-veg 'Mains'
-- and the 30-dish veg 'Breads' catch-alls, which both empty completely.
--
-- Grouped behind their own pills by CATEGORY_GROUPS in
-- app/mobile/order/[cafeteriaId]/page.tsx, each scoped to this restaurant and
-- to one side of the veg toggle.
--
-- The card's own heading for the egg section here is "Egg Delights" — the
-- same words already used by the Starters page for a different set of dishes
-- (Egg Chilly, Manchurian, Bhurji, the omelettes). A category can only belong
-- to one group, and the owner chose to keep those where they are rather than
-- duplicate three dishes across both pages. So the five curries on this page
-- are stored as 'Egg Curries' — a different name for a different set, even
-- though the card prints the same two words twice.
--
-- Two identity fixes, both confirmed by the dish's own printed description
-- rather than guessed: 'Patiala Dalak Chicken' is renamed to Patiala Palak
-- Chicken — the card describes it as simmered in "palak gravy", spinach,
-- which Dalak is not a word for — and its price corrected 209 -> 219. 'Aloo
-- Pyaaz Chur Naan' gains the second 'Chur' its sibling 'Paneer Chur Chur Naan'
-- and the card both carry.
--
-- Stuffed Parathe is priced Tawa/Tandoor, the one bread section sold in two
-- versions. The vendor form gained a matching portion scheme.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
  row jsonb;
begin

  update cafeteria_menu set name = 'Patiala Palak Chicken'
  where cafeteria_id = pj and is_veg = false and name = 'Patiala Dalak Chicken';

  update cafeteria_menu set name = 'Aloo Pyaaz Chur Chur Naan'
  where cafeteria_id = pj and is_veg = true and name = 'Aloo Pyaaz Chur Naan';

  -- Chicken Delights, Half/Full where the card prints both.
  for row in
    select * from (values
      ('Signature Delhi Butter Chicken',129,219), ('Tandoori Chicken Masala',139,239),
      ('Chicken Tikka Masala',129,219), ('Punjabi Chicken Masala',129,219),
      ('Special Chicken Takatak',139,239), ('Dhaba Style Kadhai Chicken',119,209),
      ('Chicken Kolhapuri',129,219), ('Dhaba Chicken Masala',109,189),
      ('Homestyle Chicken Curry',99,169)
    ) as t(name, half, full)
  loop
    update cafeteria_menu set
      category = 'Chicken Delights',
      price = (row->>1)::numeric,
      variants = jsonb_build_array(
        jsonb_build_object('name','Half','price',(row->>1)::numeric),
        jsonb_build_object('name','Full','price',(row->>2)::numeric)
      )
    where cafeteria_id = pj and is_veg = false and name = row->>0;
  end loop;

  -- Sold one way only, priced at the Full figure.
  update cafeteria_menu set category = 'Chicken Delights', price = 239, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = false and name = 'Pind''s Fav- Rara Chicken';
  update cafeteria_menu set category = 'Chicken Delights', price = 229, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = false and name = 'Mughlai Chicken Labaddar';
  update cafeteria_menu set category = 'Chicken Delights', price = 219, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = false and name = 'Patiala Palak Chicken';
  update cafeteria_menu set category = 'Chicken Delights', price = 239, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = false and name = 'Afghani Malai Chicken';
  update cafeteria_menu set category = 'Chicken Delights', price = 239, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = false and name = 'Nawabi Chicken Korma';
  update cafeteria_menu set category = 'Chicken Delights', price = 219, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = false and name = 'Chicken Kali Mirch';

  update cafeteria_menu set category = 'Egg Curries'
  where cafeteria_id = pj and is_veg = false and name in (
    'Egg Punjabi Masala', 'Egg Kadhai', 'Egg Kolhapuri', 'Dhaba Egg Masala', 'Egg Curry'
  );

  update cafeteria_menu set category = 'Mutton Delights'
  where cafeteria_id = pj and is_veg = false and name in (
    'Mutton Rogan Josh', 'Rara Mutton', 'Mutton Kadhai', 'Mutton Masala'
  );

  -- Breads, none priced by portion except Stuffed Parathe below.
  update cafeteria_menu set category = 'Whole Wheat'
  where cafeteria_id = pj and is_veg = true and name in (
    'Plain Phulka', 'Butter Phulka', 'Desi Ghee Phulka', 'Plain Tandoori Roti',
    'Butter Tandoori Roti', 'Bread Basket'
  );

  update cafeteria_menu set category = 'Parathe'
  where cafeteria_id = pj and is_veg = true and name in (
    'Garlic Laccha Paratha', 'SPL Laccha Paratha', 'Kerela Paratha', 'Tawa Paratha', 'Ajwain Paratha'
  );

  update cafeteria_menu set category = 'Naan'
  where cafeteria_id = pj and is_veg = true and name in (
    'Cheese Garlic Naan', 'Cheese Naan', 'Garlic Naan', 'Butter Naan', 'Plain Naan',
    'Aloo Pyaaz Chur Chur Naan', 'Paneer Chur Chur Naan'
  );

  update cafeteria_menu set category = 'Kulche'
  where cafeteria_id = pj and is_veg = true and name in (
    'Cheese Kulcha', 'Butter Kulcha', 'Plain Kulcha', 'Paneer Kulcha',
    'Aloo Pyaaz Kulcha', 'Amritsari Kulcha', 'Rumali Roti'
  );

  -- Stuffed Parathe. `price` holds the Tawa figure, the cheaper option.
  for row in
    select * from (values
      ('Aloo Paratha',55,65), ('Pyaaz Paratha',65,75), ('Aloo Pyaaz Paratha',65,75),
      ('Paneer Paratha',89,99), ('Gobi Paratha',79,89)
    ) as t(name, tawa, tandoor)
  loop
    update cafeteria_menu set
      category = 'Stuffed Parathe',
      price = (row->>1)::numeric,
      variants = jsonb_build_array(
        jsonb_build_object('name','Tawa','price',(row->>1)::numeric),
        jsonb_build_object('name','Tandoor','price',(row->>2)::numeric)
      )
    where cafeteria_id = pj and is_veg = true and name = row->>0;
  end loop;

end $$;
