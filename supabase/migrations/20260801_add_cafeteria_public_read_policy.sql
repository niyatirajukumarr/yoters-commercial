-- Add public read policy for cafeterias table
-- Allows all users (authenticated and anonymous) to view cafeterias
-- This fixes the issue where students couldn't see restaurants in browse/home pages

create policy "Public read cafeterias" on cafeterias
  for select
  using (true);
