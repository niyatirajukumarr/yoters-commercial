-- The Punjabi House shawarma page: rolls and plates, both non-veg. None of
-- these dishes existed in the app before, so this is a straight insert.
--
-- The two categories are grouped behind one "Shawarma" pill by CATEGORY_GROUPS
-- in app/mobile/order/[cafeteriaId]/page.tsx.
--
-- Shawarma is priced by the bread it is served on rather than by portion, so
-- the variants are Kuboos and Rumali. Two consequences worth knowing:
--
--   * A "-" on the card means that base is not sold for that dish. Those are
--     flat priced and name their base in the description, rather than offering
--     a choice of one option that the customer is still forced to tap.
--
--   * The plates print a single price under a "SELECT BASE" heading, so both
--     options carry the same price. The choice is kept rather than dropped:
--     the kitchen still needs to know which bread to serve.

do $$
declare
  pj uuid := '57c9055b-15bb-4d3f-8530-986b7ebeb650';
begin

  insert into cafeteria_menu (cafeteria_id, name, price, category, description, variants, is_veg, is_available)
  values
    -- Rolls
    (pj, 'Arabian Rumali Shawarma', 149, 'Shawarma Rolls', 'Rumali base', '[]'::jsonb, false, true),
    (pj, 'Classic Chicken Shawarma', 89, 'Shawarma Rolls', null,
     '[{"name":"Kuboos","price":89},{"name":"Rumali","price":99}]'::jsonb, false, true),
    (pj, 'Cheese Chicken Shawarma', 109, 'Shawarma Rolls', null,
     '[{"name":"Kuboos","price":109},{"name":"Rumali","price":119}]'::jsonb, false, true),
    (pj, 'Chipotle Chicken Shawarma', 105, 'Shawarma Rolls', null,
     '[{"name":"Kuboos","price":105},{"name":"Rumali","price":115}]'::jsonb, false, true),
    (pj, 'Tandoori Chicken Shawarma', 105, 'Shawarma Rolls', null,
     '[{"name":"Kuboos","price":105},{"name":"Rumali","price":115}]'::jsonb, false, true),
    (pj, 'Peri-Peri Chicken Shawarma', 105, 'Shawarma Rolls', null,
     '[{"name":"Kuboos","price":105},{"name":"Rumali","price":115}]'::jsonb, false, true),
    (pj, 'Mexican Shawarma', 99, 'Shawarma Rolls', null,
     '[{"name":"Kuboos","price":99},{"name":"Rumali","price":109}]'::jsonb, false, true),
    (pj, 'Jumbo Shawarma', 159, 'Shawarma Rolls', 'Kuboos base', '[]'::jsonb, false, true),
    (pj, 'Whole Wheat Shawarma Roll', 99, 'Shawarma Rolls', 'Rumali base', '[]'::jsonb, false, true),
    -- Plates
    (pj, 'Arabian Shawarma Plate', 165, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":165},{"name":"Rumali","price":165}]'::jsonb, false, true),
    (pj, 'Classic Shawarma Plate', 139, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":139},{"name":"Rumali","price":139}]'::jsonb, false, true),
    (pj, 'Cheese Shawarma Plate', 165, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":165},{"name":"Rumali","price":165}]'::jsonb, false, true),
    (pj, 'Chipotle Shawarma Plate', 155, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":155},{"name":"Rumali","price":155}]'::jsonb, false, true),
    (pj, 'Tandoori Shawarma Plate', 155, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":155},{"name":"Rumali","price":155}]'::jsonb, false, true),
    (pj, 'Peri-Peri Shawarma Plate', 155, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":155},{"name":"Rumali","price":155}]'::jsonb, false, true),
    (pj, 'Mexican Shawarma Plate', 149, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":149},{"name":"Rumali","price":149}]'::jsonb, false, true),
    (pj, 'Whole Wheat Shawarma Plate', 149, 'Shawarma Plate', null,
     '[{"name":"Kuboos","price":149},{"name":"Rumali","price":149}]'::jsonb, false, true)
  on conflict do nothing;

end $$;
