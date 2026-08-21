-- The Punjabi House Biryani page: Half/Full pricing for veg (6 dishes) and
-- non-veg (13 dishes plus 2 combo packs). 'Biryani' already existed as a flat
-- category on both sides of the veg toggle — no new grouping needed, just
-- pricing and two identity fixes.
--
-- 'Paneer Biryani' becomes Paneer Mughlai Biryani: it was missing the word
-- "Mughlai", confirmed by matching the card's ₹179 Full price for that dish
-- exactly, with nothing else filling the slot.
--
-- 'Khuska - Kebab (4pcs)' was priced ₹249; the card prints ₹169 for
-- 'Khuska + Kebab (4pcs)'. A separator character is not a naming decision, so
-- both the price and the punctuation are corrected together.
--
-- The two combo packs (Chicken Biryani Family Pack, Couple Pack) already
-- existed with the right names and prices, seeded under 'Combos' rather than
-- 'Biryani' where the card actually prints them, carrying a generic
-- auto-generated description instead of the ingredient line the card gives
-- them. Both are moved and the description replaced.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
  row jsonb;
begin

  update cafeteria_menu set name = 'Paneer Mughlai Biryani'
  where cafeteria_id = pj and is_veg = true and name = 'Paneer Biryani';

  for row in
    select * from (values
      ('Paneer Tikka Biryani',109,169), ('Paneer Mughlai Biryani',119,179),
      ('Mushroom Biryani',109,169), ('Veg Dum Biryani',105,149),
      ('TPH Special Veg Biryani',109,159), ('Chaap Tikka Biryani',109,169)
    ) as t(name, half, full)
  loop
    update cafeteria_menu set
      price = (row->>1)::numeric,
      variants = jsonb_build_array(
        jsonb_build_object('name','Half','price',(row->>1)::numeric),
        jsonb_build_object('name','Full','price',(row->>2)::numeric)
      )
    where cafeteria_id = pj and is_veg = true and category = 'Biryani' and name = row->>0;
  end loop;

  for row in
    select * from (values
      ('Hyderabadi Chicken Dum Biryani',109,169), ('Kolkata Chicken Dum Biryani',119,179),
      ('Butter Chicken Boneless Biryani',129,219), ('Chicken Tikka Biryani',129,219),
      ('Mughlai Chicken Biryani',139,219), ('Grill Chicken Biryani',139,209),
      ('Alfham Chicken + Biryani Rice',139,209), ('Tandoori Chicken Biryani',139,209),
      ('Biryani Rice (Khuska)',69,109), ('Egg Biryani',99,159)
    ) as t(name, half, full)
  loop
    update cafeteria_menu set
      price = (row->>1)::numeric,
      variants = jsonb_build_array(
        jsonb_build_object('name','Half','price',(row->>1)::numeric),
        jsonb_build_object('name','Full','price',(row->>2)::numeric)
      )
    where cafeteria_id = pj and is_veg = false and category = 'Biryani' and name = row->>0;
  end loop;

  update cafeteria_menu set name = 'Khuska + Kebab (4pcs)', price = 169
  where cafeteria_id = pj and is_veg = false and name = 'Khuska - Kebab (4pcs)';

  -- Mutton Dum Biryani and Kolkata Mutton Biryani are sold one way only, and
  -- already priced to the card — no change.

  -- Descriptions printed under the dish name, where legible on the card.
  -- Hyderabadi Chicken Dum Biryani's is cropped mid-word and left alone rather
  -- than guessed at.
  update cafeteria_menu set description = 'Fragrant rice layered with flavorful Kolkata-style chicken, fried egg & masala aalu.'
    where cafeteria_id = pj and is_veg = false and name = 'Kolkata Chicken Dum Biryani';
  update cafeteria_menu set description = 'Fragrant basmati rice layered with tender, boneless butter chicken, in a creamy gravy.'
    where cafeteria_id = pj and is_veg = false and name = 'Butter Chicken Boneless Biryani';
  update cafeteria_menu set description = 'Smoky, char-grilled chicken tikka layered with aromatic basmati rice with traditional spices.'
    where cafeteria_id = pj and is_veg = false and name = 'Chicken Tikka Biryani';
  update cafeteria_menu set description = 'Tender chicken in a rich blend of aromatic spices, creamy rich gravy infused with grated egg.'
    where cafeteria_id = pj and is_veg = false and name = 'Mughlai Chicken Biryani';

  update cafeteria_menu set category = 'Biryani', description = 'TPH SPL Biryani with 8pcs Chicken & Chicken 65'
  where cafeteria_id = pj and is_veg = false and name in (
    'Chicken Biryani Family Pack (Serves 3-4)', 'Chicken Biryani Couple Pack (Serves 2)'
  );

end $$;
