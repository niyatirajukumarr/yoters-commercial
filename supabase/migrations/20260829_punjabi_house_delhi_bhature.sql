-- 'Delhi Cholay Bhature' was missed in 20260827's Punjabi Mania split — it
-- was on that same card ("DELHI CHOLAY BHATURE (2Pcs)", ₹129) but got left
-- behind in the 'Combos' catch-all, which by the next migration looked like
-- a deliberate leftover rather than an oversight.
--
-- Moved into 'Punjabi Mania' where it belongs, and renamed to carry the piece
-- count the card prints as part of the heading — same convention as
-- 'Gulab Jamun (2 pcs)' and 'Khuska + Kebab (4pcs)'.
--
-- 'Combos' is empty after this; every dish from the four Punjabi House cards
-- it was seeded as a catch-all for has now been placed on its own card's
-- section.

update cafeteria_menu
set category = 'Punjabi Mania', name = 'Delhi Cholay Bhature (2 pcs)'
where cafeteria_id = '57c9055b-15bb-4d3f-8530-986b7ebeb650'
  and is_veg = true
  and name = 'Delhi Cholay Bhature';
