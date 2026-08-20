-- The Punjabi House "Veg Maincourse" page: six sections carved out of the
-- 48-dish veg 'Mains' catch-all, which empties completely.
--
-- Grouped behind one "Veg Maincourse" pill by CATEGORY_GROUPS in
-- app/mobile/order/[cafeteriaId]/page.tsx, scoped to this restaurant and the
-- veg side.
--
-- Every section except Kofta is priced Half/Full. Where the card prints a "-"
-- or a blank in the Half column that dish is sold one way only, so it stays
-- flat priced rather than carrying a single "Full" option the customer is
-- still made to tap.
--
-- Six prices in the app disagreed with the card and the card wins: Shahi
-- Paneer, Mushroom Tikka Masala, Chaap Butter Masala, Shahi Chaap Masala,
-- Ghee Dal Tadka and Tawa Veg. In most of those the stored figure was the
-- other portion's price.
--
-- Two identity fixes, both decided by the owner:
--   * 'Kali Masala' was 'Kaju Masala' mistyped — same price, and it sits among
--     the other kaju dishes.
--   * 'Amritsari Paneer Masala' was on no section of the card and is deleted;
--     'Paneer Butter Masala', printed at 99/189, was missing and is created.
--     No order referenced the deleted row.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
  half_full jsonb;
begin

  update cafeteria_menu set name = 'Kaju Masala'
  where cafeteria_id = pj and is_veg = true and name = 'Kali Masala';

  delete from cafeteria_menu
  where cafeteria_id = pj and is_veg = true and name = 'Amritsari Paneer Masala';

  insert into cafeteria_menu (cafeteria_id, name, price, category, is_veg, is_available, variants)
  values (pj, 'Paneer Butter Masala', 99, 'Paneer', true, true,
          '[{"name":"Half","price":99},{"name":"Full","price":189}]'::jsonb)
  on conflict do nothing;

  -- Half/Full dishes. `price` is the Half price, the cheapest option, which is
  -- what sorting and any reader ignoring variants falls back to.
  for half_full in
    select * from (values
      ('Paneer Tikka Masala','Paneer',119,209), ('Paneer Takatak','Paneer',125,209),
      ('Rara Paneer','Paneer',125,209), ('Paneer Tawa','Paneer',125,209),
      ('Paneer Butter Masala','Paneer',99,189), ('Kadhai Paneer','Paneer',99,189),
      ('Shahi Paneer','Paneer',119,199), ('Punjabi Paneer','Paneer',109,189),
      ('Paneer Kolhapuri','Paneer',109,189), ('Palak Paneer','Paneer',109,189),
      ('Paneer Do Pyaza','Paneer',109,199), ('Matar Paneer','Paneer',99,179),
      ('Mushroom Tikka Masala','Nawabi',109,199), ('Mushroom Masala','Nawabi',99,179),
      ('Matar Mushroom','Nawabi',99,179), ('Kadhai Mushroom','Nawabi',109,189),
      ('Chaap Tikka Masala','Nawabi',109,199), ('Tawa Chaap','Nawabi',109,199),
      ('Chaap Butter Masala','Nawabi',99,179), ('Punjabi Chaap Masala','Nawabi',109,189),
      ('Shahi Chaap Masala','Nawabi',119,199),
      ('Rajma Masala','Punjabi',79,169), ('Chana Masala','Punjabi',89,149),
      ('Chana Paneer Masala','Punjabi',109,189), ('Aloo Gobi Matar','Punjabi',89,149),
      ('Dal Makhani','Dal',99,179), ('Special Dhaba Style Dal','Dal',89,139),
      ('Ghee Dal Tadka','Dal',79,139), ('Dal Fry','Dal',69,129),
      ('Mix Veg','Veg Delights',89,159), ('Veg Kadhai','Veg Delights',95,169),
      ('Veg Kolhapuri','Veg Delights',99,169), ('Veg Nizami Handi','Veg Delights',109,189),
      ('Tawa Veg','Veg Delights',119,199)
    ) as t(name, category, half, full)
  loop
    update cafeteria_menu set
      category = half_full->>1,
      price = (half_full->>2)::numeric,
      variants = jsonb_build_array(
        jsonb_build_object('name', 'Half', 'price', (half_full->>2)::numeric),
        jsonb_build_object('name', 'Full', 'price', (half_full->>3)::numeric)
      )
    where cafeteria_id = pj and is_veg = true and name = half_full->>0;
  end loop;

  -- Sold one way only: flat priced at the Full figure, no options.
  update cafeteria_menu set category = 'Paneer', price = 219, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Paneer Pasanda';
  update cafeteria_menu set category = 'Paneer', price = 229, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Kaju Paneer';
  update cafeteria_menu set category = 'Paneer', price = 209, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Paneer Bhurji';
  update cafeteria_menu set category = 'Nawabi', price = 229, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Kaju Masala';
  update cafeteria_menu set category = 'Nawabi', price = 239, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Kaju Kolhapuri';
  update cafeteria_menu set category = 'Punjabi', price = 179, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Veg Jalfrezi';
  update cafeteria_menu set category = 'Punjabi', price = 169, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Punjabi Kadhi Pakoda';
  update cafeteria_menu set category = 'Punjabi', price = 129, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Aloo Jeera - Dry';
  update cafeteria_menu set category = 'Punjabi', price = 149, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Bhindi Fry - Dry';
  update cafeteria_menu set category = 'Punjabi', price = 159, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Bhindi Masala';
  update cafeteria_menu set category = 'Veg Delights', price = 169, variants = '[]'::jsonb
    where cafeteria_id = pj and is_veg = true and name = 'Green Peas Masala';

  -- Kofta is the one section the card prints at a single price throughout.
  update cafeteria_menu set category = 'Kofta', variants = '[]'::jsonb
  where cafeteria_id = pj and is_veg = true
    and name in ('Malai Paneer Kofta', 'Veg Kofta', 'Paneer Kofta');

end $$;
