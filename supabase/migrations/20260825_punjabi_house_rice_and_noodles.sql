-- The Punjabi House "Rice & Noodles" page. Veg gets three sections — Rice
-- Variety, Noodles, Fried Rice; non-veg gets Noodles and Fried Rice only,
-- matching the two cards. Carved from a single catch-all 'Rice' category on
-- each side (23 veg rows, 24 non-veg), which both empty completely.
--
-- One "Rice & Noodles" label is used for two CATEGORY_GROUPS entries in
-- app/mobile/order/[cafeteriaId]/page.tsx, one per side of the veg toggle.
-- 'Noodles' and 'Fried Rice' are members of both, and that is safe only
-- because resolveGroups there filters by side before building the member map
-- — the two never apply at once.
--
-- Two renames, found the same way on both sides of the toggle: a "Rice" name
-- one word short of "Fried Rice", at the exact price the Fried Rice list
-- printed for it, with no other item filling that slot. 'Chilli Garlic Rice'
-- (veg) and 'Chilli Garlic Chicken Rice' (non-veg) both become their "Fried
-- Rice" names. The second one was caught after an insert had already created
-- a genuine duplicate under the correct name — that duplicate is deleted here
-- and the original row is the one kept and renamed, so its id and order
-- history survive.
--
-- Chicken Noodles was stored at Chicken Chowmein's price; corrected to the
-- card's own ₹135.
--
-- 'Pepper Noodles' and 'Paneer Noodles' are two dishes, not one mistyped as
-- the other — the owner's call. Paneer Noodles did not exist and is created.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
  row jsonb;
begin

  update cafeteria_menu set name = 'Chilli Garlic Fried Rice'
  where cafeteria_id = pj and is_veg = true and name = 'Chilli Garlic Rice';

  -- Delete first: if this runs on a database that never had the mistaken
  -- insert, the delete is a no-op and the rename below still lands correctly.
  delete from cafeteria_menu
  where cafeteria_id = pj and is_veg = false and name = 'Chilli Garlic Chicken Fried Rice';
  update cafeteria_menu set name = 'Chilli Garlic Chicken Fried Rice'
  where cafeteria_id = pj and is_veg = false and name = 'Chilli Garlic Chicken Rice';

  -- Rice Variety: Half/Full where the card prints both.
  for row in
    select * from (values ('Steam Rice',55,89), ('Jeera Rice',69,109), ('Ghee Rice',79,119)) as t(name, half, full)
  loop
    update cafeteria_menu set
      category = 'Rice Variety',
      price = (row->>1)::numeric,
      variants = jsonb_build_array(
        jsonb_build_object('name','Half','price',(row->>1)::numeric),
        jsonb_build_object('name','Full','price',(row->>2)::numeric)
      )
    where cafeteria_id = pj and is_veg = true and name = row->>0;
  end loop;

  -- Sold one way (Dal/Palak Khichdi) or one price throughout (the pulavs,
  -- Masala Rice, Curd Rice) — the stored prices already match the card.
  update cafeteria_menu set category = 'Rice Variety'
  where cafeteria_id = pj and is_veg = true and name in (
    'Dal Khichdi', 'Palak Khichdi', 'Masala Rice', 'Paneer Pulav', 'Veg Pulav',
    'Green Peas Pulav', 'Curd Rice'
  );

  update cafeteria_menu set category = 'Noodles'
  where cafeteria_id = pj and is_veg = true and name in (
    'Veg Chowmein', 'Veg Noodles', 'Manchurian Noodles', 'Gobi Noodles',
    'Mushroom Noodles', 'Chilli Garlic Noodles', 'Pepper Noodles'
  );

  insert into cafeteria_menu (cafeteria_id, name, price, category, is_veg, is_available, variants)
  values (pj, 'Paneer Noodles', 139, 'Noodles', true, true, '[]'::jsonb)
  on conflict do nothing;

  update cafeteria_menu set category = 'Noodles'
  where cafeteria_id = pj and is_veg = false and name in (
    'Chicken Chowmein', 'Chicken Noodles', 'Schezwan Chicken Noodles',
    'Chilli Garlic Chicken Noodles', 'Egg Noodles', 'Egg Schezwan Noodles',
    'Egg Chilli Garlic Noodles'
  );
  update cafeteria_menu set price = 135
  where cafeteria_id = pj and is_veg = false and name = 'Chicken Noodles';

  update cafeteria_menu set category = 'Fried Rice'
  where cafeteria_id = pj and is_veg = true and name in (
    'Veg Fried Rice', 'Manchurian Fried Rice', 'Gobi Fried Rice',
    'Paneer Fried Rice', 'Mushroom Fried Rice', 'Chilli Garlic Fried Rice'
  );

  update cafeteria_menu set category = 'Fried Rice'
  where cafeteria_id = pj and is_veg = false and name in (
    'Chicken Fried Rice', 'Schezwan Chicken Fried Rice', 'Egg Fried Rice',
    'Egg Schezwan Fried Rice', 'Egg Chilli Garlic Fried Rice',
    'Chilli Garlic Chicken Fried Rice'
  );

end $$;
