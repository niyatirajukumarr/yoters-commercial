-- ============================================
-- Yoters Commercial Schema — Full setup
-- Run this in your NEW Supabase project's SQL Editor
-- ============================================

-- CAFETERIAS (restaurants)
create table cafeterias (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  location text not null,
  image_emoji text default '🍱',
  image_url text,
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

-- ORDERS
create table orders (
  id uuid default gen_random_uuid() primary key,
  cafeteria_id uuid references cafeterias(id) on delete cascade,
  student_name text not null,
  student_phone text not null,
  student_email text,
  items jsonb not null default '[]',
  total_amount numeric(10,2) not null default 0,
  queue_position integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending','paid','approved','preparing','ready','collected','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','refund_initiated','refund_successful')),
  razorpay_order_id text,
  razorpay_payment_id text,
  cashfree_order_id text,
  approved_at timestamptz,
  denied_at timestamptz,
  denial_reason text,
  ready_at timestamptz,
  collected_at timestamptz,
  token_number integer,
  is_shared boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
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

-- PROFILES (for auth)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  phone text,
  created_at timestamptz default now()
);

-- TOKEN SEQUENCES (per-cafeteria daily token numbers)
create table token_sequences (
  cafeteria_id uuid references cafeterias(id) on delete cascade primary key,
  current_token integer default 0,
  reset_date date default current_date
);

-- PAYOUTS
create table payouts (
  id uuid default gen_random_uuid() primary key,
  cafeteria_id uuid references cafeterias(id) on delete cascade,
  amount numeric(10,2) not null,
  status text default 'pending',
  created_at timestamptz default now()
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
alter table profiles enable row level security;
alter table token_sequences enable row level security;
alter table payouts enable row level security;

-- Public read for customers
create policy "Public read cafeterias" on cafeterias for select using (true);
create policy "Public read queues" on cafeteria_queues for select using (true);
create policy "Public read menu" on cafeteria_menu for select using (true);

-- Customers can place orders
create policy "Customers place orders" on orders for insert with check (true);
create policy "Public read orders" on orders for select using (true);
create policy "Update orders" on orders for update using (true);

-- Vendors manage their own restaurant data
create policy "Vendor manage cafeterias" on cafeterias for all using (true);
create policy "Vendor manage queues" on cafeteria_queues for all using (true);
create policy "Vendor manage menu" on cafeteria_menu for all using (true);

-- Notifications
create policy "Public read notifications" on notifications for select using (true);
create policy "Create notifications" on notifications for insert with check (true);
create policy "Update notifications" on notifications for update using (true);

-- Profiles
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);

-- Token sequences / payouts (service role only via API, but allow read)
create policy "Public read token sequences" on token_sequences for select using (true);
create policy "Manage token sequences" on token_sequences for all using (true);
create policy "Public read payouts" on payouts for select using (true);
create policy "Manage payouts" on payouts for all using (true);
