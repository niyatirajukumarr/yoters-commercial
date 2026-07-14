-- Add veg / non-veg classification to menu items.
-- Existing items default to veg (true); mark non-veg items as needed.
alter table cafeteria_menu
  add column if not exists is_veg boolean default true;

-- Example: mark specific items as non-veg
-- update cafeteria_menu set is_veg = false
-- where name ilike '%chicken%' or name ilike '%egg%' or name ilike '%mutton%'
--    or name ilike '%fish%' or name ilike '%prawn%' or name ilike '%meat%';
