-- The Punjabi House prints its veg starters as four sections on one menu card.
-- All 39 dishes already existed here, flat under 'Starters' and 'Soups', so
-- this splits them into the four printed sections rather than inserting
-- anything — inserting would have produced 39 duplicates.
--
-- The four new categories are grouped behind one "Starters" pill by
-- CATEGORY_GROUPS in app/mobile/order/[cafeteriaId]/page.tsx. Renaming a
-- category here without updating that list would break the grouping, and the
-- section would reappear as four separate top-level pills.
--
-- Scoped to is_veg = true throughout: the non-veg side keeps its own flat
-- 'Starters' and 'Soups' categories, which this must not touch.
--
-- Must run after 20260816_add_punjabi_house_menu.sql, which seeds these dishes
-- flat. Dated to sort after it for that reason: on a rebuilt database the
-- earlier date meant this ran against an empty menu, matched nothing, and the
-- four sections silently never appeared.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
begin

  -- 1. Veg Tandoor Starters ---------------------------------------------------
  update cafeteria_menu set category = 'Veg Tandoor Starters'
  where cafeteria_id = pj and is_veg = true and name in (
    'Paneer Tikka', 'Peri Peri Paneer Tikka', 'Afghani Malai Paneer Tikka',
    'Achari Paneer Tikka', 'Lemon Paneer Tikka', 'Lemon Chaap Tikka',
    'Peri Peri Chaap Tikka', 'Delhi Soya Chaap Tikka', 'Afghani Malai Soya Chaap',
    'Tandoori Mushroom', 'Hara Bhara Kebab', 'Dahi Kebab', 'Veg Tandoori Platter'
  );

  -- Piece-count pricing. `price` holds the cheapest option, matching the
  -- Half/Full convention already used at Bombay Dine: the card shows a button
  -- per option and the cart records which was picked.
  update cafeteria_menu set price = 119, variants =
    '[{"name":"4pc","price":119},{"name":"6pc","price":179},{"name":"8pc","price":219}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Paneer Tikka';

  update cafeteria_menu set price = 129, variants =
    '[{"name":"4pc","price":129},{"name":"6pc","price":189},{"name":"8pc","price":229}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Peri Peri Paneer Tikka';

  update cafeteria_menu set price = 135, variants =
    '[{"name":"4pc","price":135},{"name":"6pc","price":195},{"name":"8pc","price":239}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Afghani Malai Paneer Tikka';

  update cafeteria_menu set price = 129, variants =
    '[{"name":"4pc","price":129},{"name":"6pc","price":189},{"name":"8pc","price":229}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Achari Paneer Tikka';

  update cafeteria_menu set price = 135, variants =
    '[{"name":"4pc","price":135},{"name":"6pc","price":195},{"name":"8pc","price":245}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Lemon Paneer Tikka';

  -- The chaap and soya dishes are printed with no 4pc column, so they get two
  -- options rather than an invented third.
  update cafeteria_menu set price = 135, variants =
    '[{"name":"6pc","price":135},{"name":"8pc","price":199}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Lemon Chaap Tikka';

  update cafeteria_menu set price = 129, variants =
    '[{"name":"6pc","price":129},{"name":"8pc","price":189}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Peri Peri Chaap Tikka';

  update cafeteria_menu set price = 125, variants =
    '[{"name":"6pc","price":125},{"name":"8pc","price":179}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Delhi Soya Chaap Tikka';

  update cafeteria_menu set price = 135, variants =
    '[{"name":"6pc","price":135},{"name":"8pc","price":199}]'::jsonb
  where cafeteria_id = pj and is_veg = true and name = 'Afghani Malai Soya Chaap';

  -- Tandoori Mushroom, Hara Bhara Kebab, Dahi Kebab and Veg Tandoori Platter
  -- carry a single price on the card with no piece count against it, so they
  -- stay flat. Their existing prices already match the card.

  -- 2. Paneer Starters --------------------------------------------------------
  update cafeteria_menu set category = 'Paneer Starters'
  where cafeteria_id = pj and is_veg = true and name in (
    'Paneer Chilly', 'Paneer Manchurian', 'Dragon Paneer', 'Paneer Majestic',
    'Paneer Pepper Dry', 'Paneer 65', 'Lemon Paneer'
  );

  -- 3. Appetizers & Soups -----------------------------------------------------
  update cafeteria_menu set category = 'Appetizers & Soups'
  where cafeteria_id = pj and is_veg = true and name in (
    'Masala Papad', 'Roasted / Fry Papad', 'Dal Bhadi Raita', 'Spl Pahadi Raita',
    'Veg / Boondi Raita', 'Green Salad', 'Veg Manchow Soup', 'Veg Hot & Sour Soup',
    'Tomato Soup', 'Lemon Coriander Soup'
  );

  -- Two corrections against the printed card, which is authoritative:
  -- the papad is ₹25 there, not the ₹23 stored, and the raita is Spl Pahadi,
  -- which had been entered as "Dal Bhadi".
  update cafeteria_menu set price = 25
  where cafeteria_id = pj and is_veg = true and name = 'Roasted / Fry Papad';

  update cafeteria_menu set name = 'Spl Pahadi Raita'
  where cafeteria_id = pj and is_veg = true and name = 'Dal Bhadi Raita';

  -- 4. Veg Chinese Starters ---------------------------------------------------
  update cafeteria_menu set category = 'Veg Chinese Starters'
  where cafeteria_id = pj and is_veg = true and name in (
    'Honey Chilly Potato', 'Crispy Corn', 'Veg Manchurian', 'Crispy Chilli Potato',
    'Gobi Manchurian / Chilly', 'Gobi Pepper Dry / 65', 'Mushroom Manchurian / Chilly',
    'Mushroom Pepper Dry', 'Babycorn Manchurian / Chilly', 'Babycorn Pepper Dry'
  );

  -- Third correction against the card: ₹159 there, ₹169 stored. Its sibling
  -- Babycorn Pepper Dry really is ₹169, which is likely how the two got
  -- levelled at some point.
  update cafeteria_menu set price = 159
  where cafeteria_id = pj and is_veg = true and name = 'Babycorn Manchurian / Chilly';

end $$;
