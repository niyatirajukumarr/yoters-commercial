-- The Punjabi House "Thali's & Combo's" page: Veg Thali (4) and Punjabi Mania
-- (6) on the veg side, Non-Veg Thali (4) on the non-veg side. Almost entirely
-- re-categorisation out of the flat 'Combos' catch-all, which keeps every
-- dish these three cards do not name — the Bowls, the other Combos — for a
-- later card.
--
-- One "Thali's & Combo's" label spans two CATEGORY_GROUPS entries, veg and
-- non-veg, the same pattern as "Rice & Noodles": only one applies at a time,
-- so 'Non-Veg Thali' being a member of the non-veg entry never collides with
-- the veg one.
--
-- One dietary-label fix, confirmed by the owner rather than assumed: 'Poori
-- Sabi Combo' was stored non-veg at a single ₹149, one letter short of the
-- card's veg 'Poori Sabji Combo' — described on the card as Aloo Matar or
-- Matar Paneer, no meat anywhere in it. Flipped to veg, renamed, and given
-- the two named prices the card actually offers (Aloo Matar ₹129 / Matar
-- Paneer ₹149) instead of one flat figure. Getting a veg/non-veg flag wrong
-- is not a cosmetic error — it is a dietary claim — so this was asked rather
-- than inferred from the name alone.
--
-- Two dishes on the Punjabi Mania card did not exist anywhere in the app:
-- Aloo Paratha Combo and Chaap Tikka Rumali Combo.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
begin

  update cafeteria_menu set category = 'Veg Thali', description = 'Punjabi Paneer, Mix Veg, Dal Makhani, Basmati Rice, Roti / B.Naan / Phulka / Kerela Paratha, Boondi Raita, Jamun, Salad, Papad, Pickle'
    where cafeteria_id = pj and is_veg = true and name = 'SPL Veg Punjabi Thali';
  update cafeteria_menu set category = 'Veg Thali', description = 'Punjabi Paneer, Dal Fry, Basmati Rice, Roti / B.Naan / Phulka / Kerela Paratha, Jamun, Salad'
    where cafeteria_id = pj and is_veg = true and name = 'Premium Veg Thali';
  update cafeteria_menu set category = 'Veg Thali', description = 'Amritsari Cholay, Dal Fry, Basmati Rice, Roti / B.Naan / Phulka / Kerela Paratha, Jamun, Salad'
    where cafeteria_id = pj and is_veg = true and name = 'Cholay/Rajma Thali';
  update cafeteria_menu set category = 'Veg Thali', description = 'Gobi Manchurian, Dal Fry, Basmati Rice, Roti / B.Naan / Phulka / Kerela Paratha, Jamun, Salad'
    where cafeteria_id = pj and is_veg = true and name = 'Gobi Manchurian Thali';

  update cafeteria_menu set category = 'Non-Veg Thali', description = 'Butter Chicken, Chicken Masala, Dal Makhani, Jeera Rice, Roti / B.Naan / Phulka / Kerela Paratha, Boondi Raita, Jamun, Salad, Papad, Pickle'
    where cafeteria_id = pj and is_veg = false and name = 'SPL Non-Veg Punjabi Thali';
  update cafeteria_menu set category = 'Non-Veg Thali', description = 'Butter Chicken, Dal Fry, Basmati Rice, Roti / B.Naan / Phulka / Kerela Paratha, Jamun, Salad'
    where cafeteria_id = pj and is_veg = false and name = 'Butter Chicken Thali';
  update cafeteria_menu set category = 'Non-Veg Thali', description = 'Chicken Masala, Dal Fry, Basmati Rice, Roti / B.Naan / Phulka / Kerela Paratha, Jamun, Salad'
    where cafeteria_id = pj and is_veg = false and name = 'Chicken Masala Thali';
  update cafeteria_menu set category = 'Non-Veg Thali', description = 'Choice of Chicken, Rumali Roti, Khuska Rice, Raita, Jamun, Mayonnaise, Salad'
    where cafeteria_id = pj and is_veg = false and name = 'Grill/Alfham/Tandoori Chicken Meal';

  update cafeteria_menu set category = 'Punjabi Mania', description = '2 pcs Stuffed Kulcha with choice of Cholay / Dal Makhani & Boondi Raita'
    where cafeteria_id = pj and is_veg = true and name = 'Amritsari Aloo Kulcha Combo';
  update cafeteria_menu set category = 'Punjabi Mania', description = 'Spl Stuffed naan served with Dal Makhani, Mix Veg & Raita'
    where cafeteria_id = pj and is_veg = true and name = 'Paneer Chur-Chur Naan Combo';
  update cafeteria_menu set category = 'Punjabi Mania', description = 'Spl Stuffed naan served with Dal Makhani, Mix Veg & Raita'
    where cafeteria_id = pj and is_veg = true and name = 'Aloo Pyaaz Chur-Chur Naan';

  -- Dietary-label fix, owner-confirmed: same dish as the veg card, mis-flagged
  -- non-veg at one flat price instead of the two the card offers.
  update cafeteria_menu set
    name = 'Poori Sabji Combo', category = 'Punjabi Mania', is_veg = true, price = 129,
    variants = '[{"name":"Aloo Matar","price":129},{"name":"Matar Paneer","price":149}]'::jsonb,
    description = '4 pcs Poori with Aloo Matar / Matar Paneer + Raita + Pickle'
  where cafeteria_id = pj and is_veg = false and name = 'Poori Sabi Combo';

  insert into cafeteria_menu (cafeteria_id, name, price, category, description, is_veg, is_available, variants)
  values
    (pj, 'Aloo Paratha Combo', 139, 'Punjabi Mania', '2 pcs Paratha with choice of Cholay / Dal Makhani & Boondi Raita', true, true, '[]'::jsonb),
    (pj, 'Chaap Tikka Rumali Combo', 189, 'Punjabi Mania', 'Malai / Punjabi Chaap Tikka + Rumali Roti - 2 pcs + Mint Chutney', true, true, '[]'::jsonb)
  on conflict do nothing;

end $$;
