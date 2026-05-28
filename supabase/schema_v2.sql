-- ============================================
-- Yoters Schema v2 — College Cafeteria
-- Run this in Supabase SQL Editor
-- ============================================

-- DROP existing tables (fresh start)
drop table if exists pre_orders cascade;
drop table if exists queue_entries cascade;
drop table if exists menu_items cascade;
drop table if exists queues cascade;
drop table if exists restaurants cascade;

-- New tables
drop table if exists orders cascade;
drop table if exists cafeteria_menu cascade;
drop table if exists cafeteria_queues cascade;
drop table if exists cafeterias cascade;

-- CAFETERIAS
create table cafeterias (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  location text not null,
  image_emoji text default '🍱',
  is_open boolean default true,
  vendor_email text unique not null,
  upi_id text,
  created_at timestamptz default now()
);

-- CAFETERIA QUEUES (live state per cafeteria)
create table cafeteria_queues (
  id uuid default gen_random_uuid() primary key,
  cafeteria_id uuid references cafeterias(id) on delete cascade unique,
  queue_count integer default 0,
  avg_wait_mins integer default 10,
  updated_at timestamptz default now()
);

-- MENU ITEMS
create table cafeteria_menu (
  id uuid default gen_random_uuid() primary key,
  cafeteria_id uuid references cafeterias(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text not null default 'Main',
  is_available boolean default true,
  image_url text,
  stock_quantity integer,
  max_stock integer,
  created_at timestamptz default now()
);

-- ORDERS (student pre-orders + queue entries combined)
create table orders (
  id uuid default gen_random_uuid() primary key,
  cafeteria_id uuid references cafeterias(id) on delete cascade,
  student_name text not null,
  student_phone text not null,
  student_email text,
  items jsonb not null default '[]',
  total_amount numeric(10,2) not null default 0,
  queue_position integer not null,
  status text not null default 'pending'
    check (status in ('pending','paid','approved','preparing','ready','collected','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid')),
  cashfree_order_id text,
  approved_at timestamptz,
  denied_at timestamptz,
  denial_reason text,
  notes text,
  created_at timestamptz default now(),
  ready_at timestamptz,
  collected_at timestamptz
);

-- NOTIFICATIONS (for vendor approvals, student messages, etc.)
create table notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_type text not null check (recipient_type in ('student', 'vendor', 'manager')),
  recipient_id text not null,
  order_id uuid references orders(id) on delete cascade,
  notification_type text not null,
  message text not null,
  sms_sent boolean default false,
  sms_response text,
  read boolean default false,
  created_at timestamptz default now()
);

-- MANAGER AUDIT LOG
create table manager_audit_log (
  id uuid default gen_random_uuid() primary key,
  manager_email text not null,
  action text not null,
  details jsonb,
  timestamp timestamptz default now()
);

-- INDEXES
create index idx_orders_cafeteria on orders(cafeteria_id);
create index idx_orders_status on orders(status);
create index idx_orders_cafeteria_status on orders(cafeteria_id, status);
create index idx_orders_payment_status on orders(payment_status);
create index idx_menu_cafeteria on cafeteria_menu(cafeteria_id);
create index idx_menu_stock on cafeteria_menu(stock_quantity);
create index idx_notifications_recipient on notifications(recipient_type, recipient_id);
create index idx_notifications_order on notifications(order_id);
create index idx_audit_log_manager on manager_audit_log(manager_email);

-- STORAGE BUCKET FOR MENU ITEM IMAGES
-- Note: Create 'menu-item-images' bucket in Supabase Storage manually
-- Then add RLS policy: Allow vendors to upload/read own cafeteria's images

-- REALTIME
alter publication supabase_realtime add table cafeteria_queues;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table notifications;

-- RLS
alter table cafeterias enable row level security;
alter table cafeteria_queues enable row level security;
alter table cafeteria_menu enable row level security;
alter table orders enable row level security;
alter table notifications enable row level security;
alter table manager_audit_log enable row level security;

-- Public read for students
create policy "Public read cafeterias" on cafeterias for select using (true);
create policy "Public read queues" on cafeteria_queues for select using (true);
create policy "Public read menu" on cafeteria_menu for select using (true);

-- Students can place orders
create policy "Students place orders" on orders for insert with check (true);
create policy "Public read orders" on orders for select using (true);
create policy "Update orders" on orders for update using (true);

-- Vendors manage their own cafeteria data
create policy "Vendor manage cafeterias" on cafeterias for all using (true);
create policy "Vendor manage queues" on cafeteria_queues for all using (true);
create policy "Vendor manage menu" on cafeteria_menu for all using (true);

-- Notifications (students can read their own, vendors can read theirs)
create policy "Public read notifications" on notifications for select using (true);
create policy "Create notifications" on notifications for insert with check (true);
create policy "Update notifications" on notifications for update using (true);

-- Manager audit log (public write/read for now, will be restricted later)
create policy "Public read audit log" on manager_audit_log for select using (true);
create policy "Create audit log" on manager_audit_log for insert with check (true);

-- AUTO-UPDATE queue count trigger (counts: pending, paid, approved, preparing)
create or replace function update_cafeteria_queue()
returns trigger as $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from orders
  where cafeteria_id = coalesce(new.cafeteria_id, old.cafeteria_id)
    and status in ('pending', 'paid', 'approved', 'preparing');

  update cafeteria_queues
  set queue_count = active_count,
      updated_at = now()
  where cafeteria_id = coalesce(new.cafeteria_id, old.cafeteria_id);

  return new;
end;
$$ language plpgsql;

create or replace trigger order_changed
after insert or update or delete on orders
for each row execute function update_cafeteria_queue();

-- ============================================
-- SEED DATA — 4 Cafeterias
-- ============================================

insert into cafeterias (id, name, description, location, image_emoji, vendor_email) values
  ('caf00001-0001-0001-0001-000000000001', 'Main Block Cafeteria', 'Hot meals, snacks and beverages', 'Main Block, Ground Floor', '🍱', 'main@yoters.com'),
  ('caf00002-0002-0002-0002-000000000002', 'Engineering Block Canteen', 'Quick bites and South Indian meals', 'Engineering Block, Level 1', '🥘', 'engr@yoters.com'),
  ('caf00003-0003-0003-0003-000000000003', 'North Campus Food Court', 'Multi-cuisine, beverages and desserts', 'North Campus, Near Library', '🧆', 'north@yoters.com'),
  ('caf00004-0004-0004-0004-000000000004', 'Sports Block Snack Bar', 'Light snacks, juices and energy drinks', 'Sports Complex', '🥤', 'sports@yoters.com')
on conflict do nothing;

insert into cafeteria_queues (cafeteria_id, queue_count, avg_wait_mins) values
  ('caf00001-0001-0001-0001-000000000001', 6, 15),
  ('caf00002-0002-0002-0002-000000000002', 2, 8),
  ('caf00003-0003-0003-0003-000000000003', 10, 25),
  ('caf00004-0004-0004-0004-000000000004', 0, 5)
on conflict do nothing;

insert into cafeteria_menu (cafeteria_id, name, description, price, category) values
  ('caf00001-0001-0001-0001-000000000001', 'Veg Thali', 'Rice, dal, sabzi, roti, curd', 80, 'Meals'),
  ('caf00001-0001-0001-0001-000000000001', 'Chicken Biryani', 'Fragrant rice with chicken', 120, 'Meals'),
  ('caf00001-0001-0001-0001-000000000001', 'Masala Dosa', 'Crispy dosa with potato filling', 50, 'Breakfast'),
  ('caf00001-0001-0001-0001-000000000001', 'Samosa (2pcs)', 'Fried potato pastry', 20, 'Snacks'),
  ('caf00001-0001-0001-0001-000000000001', 'Chai', 'Masala tea', 15, 'Beverages'),
  ('caf00002-0002-0002-0002-000000000002', 'Idli Sambar', '3 idlis with sambar and chutney', 40, 'Breakfast'),
  ('caf00002-0002-0002-0002-000000000002', 'Veg Fried Rice', 'Indo-Chinese style', 70, 'Meals'),
  ('caf00002-0002-0002-0002-000000000002', 'Egg Roll', 'Egg wrap with veggies', 60, 'Snacks'),
  ('caf00002-0002-0002-0002-000000000002', 'Cold Coffee', 'Blended with ice cream', 60, 'Beverages'),
  ('caf00003-0003-0003-0003-000000000003', 'Paneer Butter Masala + Naan', 'Rich creamy paneer curry', 130, 'Meals'),
  ('caf00003-0003-0003-0003-000000000003', 'Pasta Arrabiata', 'Spicy tomato pasta', 90, 'Meals'),
  ('caf00003-0003-0003-0003-000000000003', 'Fresh Lime Soda', 'Sweet or salted', 30, 'Beverages'),
  ('caf00003-0003-0003-0003-000000000003', 'Brownie', 'Chocolate walnut brownie', 45, 'Desserts'),
  ('caf00004-0004-0004-0004-000000000004', 'Protein Bar', 'Peanut butter energy bar', 50, 'Snacks'),
  ('caf00004-0004-0004-0004-000000000004', 'Banana Shake', 'Fresh banana milkshake', 60, 'Beverages'),
  ('caf00004-0004-0004-0004-000000000004', 'Veg Sandwich', 'Grilled with cheese', 55, 'Snacks')
on conflict do nothing;
