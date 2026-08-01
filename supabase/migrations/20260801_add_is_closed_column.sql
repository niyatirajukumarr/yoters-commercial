-- Add is_closed column to cafeterias table
alter table cafeterias
add column if not exists is_closed boolean default false;

-- Create an index for faster queries
create index if not exists idx_cafeterias_is_closed on cafeterias(is_closed);
