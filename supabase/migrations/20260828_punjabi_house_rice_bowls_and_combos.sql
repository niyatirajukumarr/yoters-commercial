-- The Punjabi House "Rice Bowls & Combos" page: TPH Signature Combos (6),
-- TPH Rice Bowls (9), TPH Chinese Bowls (3), Refreshment's (7). Carved from
-- the last of the flat 'Combos' catch-all — both is_veg sides of it empty
-- completely here except one leftover — and from 'Desserts', which also
-- empties.
--
-- Unlike the last several splits, this group carries no `side` in
-- CATEGORY_GROUPS: the physical card itself mixes veg and non-veg dishes
-- within a section (Chicken Tikka Masala Combo sits beside Veg Curry Combo
-- under one "TPH Signature Combos" heading). The existing per-item is_veg
-- filter — upstream of grouping — does the actual split; the group just
-- names the four sections and lets whichever are non-empty appear.
-- Refreshment's has no non-veg members, so it simply does not appear there.
--
-- Two renames, matched by price rather than by name: 'Kadi Pakoda Rice Bowl'
-- to the card's 'Kadhi Pakoda Rice Bowl' (alternate spelling, same ₹149), and
-- 'Gulab Jamun' to 'Gulab Jamun (2 pcs)', the piece count the card prints as
-- part of the heading rather than as a separate description line.
--
-- 'Delhi Cholay Bhature' is the one veg 'Combos' dish this card does not
-- name; it stays in 'Combos' rather than being guessed into a section.
--
-- Every price already matched the card — no corrections this time.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
begin

  update cafeteria_menu set category = 'TPH Signature Combos', description = 'Choice of Cholay / Rajma / Dal Makhani + choice of Tandoori Roti / B.Naan / Phulka / Kerela Paratha + Boondi Raita + Jamun'
    where cafeteria_id = pj and is_veg = true and name = 'Veg Curry Combo';
  update cafeteria_menu set category = 'TPH Signature Combos', description = 'Kadhai Paneer + choice of Tandoori Roti / B.Naan / Phulka / Kerela Paratha + Boondi Raita + Jamun'
    where cafeteria_id = pj and is_veg = true and name = 'Kadhai Paneer Combo';
  update cafeteria_menu set category = 'TPH Signature Combos', description = 'Gobi Manchurian + choice of Tandoori Roti / B.Naan / Phulka / Kerela Paratha + Boondi Raita + Jamun'
    where cafeteria_id = pj and is_veg = true and name = 'Gobi Manchurian Combo';

  update cafeteria_menu set category = 'TPH Signature Combos', description = 'Chicken Tikka Masala + choice of Tandoori Roti / B.Naan / Phulka / Kerela Paratha + Boondi Raita + Jamun'
    where cafeteria_id = pj and is_veg = false and name = 'Chicken Tikka Masala Combo';
  update cafeteria_menu set category = 'TPH Signature Combos', description = 'Butter Chicken + choice of Tandoori Roti / B.Naan / Phulka / Kerela Paratha + Boondi Raita + Jamun'
    where cafeteria_id = pj and is_veg = false and name = 'Butter Chicken Combo';
  update cafeteria_menu set category = 'TPH Signature Combos', description = 'Chilly Chicken + choice of Tandoori Roti / B.Naan / Phulka / Kerela Paratha + Boondi Raita + Jamun'
    where cafeteria_id = pj and is_veg = false and name = 'Chilly Chicken Combo';

  update cafeteria_menu set category = 'TPH Rice Bowls'
    where cafeteria_id = pj and is_veg = true and name in (
      'Cholay Rice Bowl', 'Kadhai Paneer Rice Bowl', 'Dal Makhani Rice Bowl',
      'Dal Tadka Rice Bowl', 'Rajma Chawal Bowl'
    );
  update cafeteria_menu set name = 'Kadhi Pakoda Rice Bowl', category = 'TPH Rice Bowls'
    where cafeteria_id = pj and is_veg = true and name = 'Kadi Pakoda Rice Bowl';
  update cafeteria_menu set category = 'TPH Rice Bowls'
    where cafeteria_id = pj and is_veg = false and name in (
      'Butter Chicken Rice Bowl', 'Chicken Curry Rice Bowl', 'Egg Curry Rice Bowl'
    );

  update cafeteria_menu set category = 'TPH Chinese Bowls', description = 'Choice of Veg Fried Rice / Noodles + choice of Veg / Gobi Manchurian'
    where cafeteria_id = pj and is_veg = true and name = 'Gobi / Veg Manchurian Bowl';
  update cafeteria_menu set category = 'TPH Chinese Bowls', description = 'Choice of Veg Fried Rice / Noodles + Paneer Chilly'
    where cafeteria_id = pj and is_veg = true and name = 'Paneer Chilly Bowl';
  update cafeteria_menu set category = 'TPH Chinese Bowls', description = 'Choice of Chicken Fried Rice / Noodles / B.Naan / Roti / Phulka / Steamed Rice + Chilly Chicken'
    where cafeteria_id = pj and is_veg = false and name = 'Chilly Chicken Bowl';

  update cafeteria_menu set name = 'Gulab Jamun (2 pcs)'
    where cafeteria_id = pj and is_veg = true and name = 'Gulab Jamun';
  update cafeteria_menu set category = 'Refreshment''s'
    where cafeteria_id = pj and is_veg = true and name in (
      'Punjabi Sweet Lassi', 'Butter Milk', 'Gulab Jamun (2 pcs)', 'Choco Lava Cake',
      'Walnut Brownie', 'Matka Rabdi', 'Rasmalai'
    );

end $$;
