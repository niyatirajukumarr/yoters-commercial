-- Add is_veg column to cafeteria_menu table
alter table cafeteria_menu
add column if not exists is_veg boolean default true;
