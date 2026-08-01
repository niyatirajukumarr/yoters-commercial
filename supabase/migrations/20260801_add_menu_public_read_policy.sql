-- Ensure cafeteria_menu is publicly readable
-- This is needed for browsing restaurants and viewing descriptions

create policy if not exists "Public read menu" on cafeteria_menu
  for select
  using (true);
