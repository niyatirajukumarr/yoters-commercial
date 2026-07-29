-- ============================================================
-- Close remaining open RLS gaps (2026-07-30 re-audit)
--
-- The 20260718 hardening migration scoped `orders` and `payouts` but never
-- touched `cafeterias`, `cafeteria_menu`, `cafeteria_queues`,
-- `token_sequences`, or `notifications` — all still carried their original
-- `for all using (true)` / `using (true)` policies from schema_commercial.sql,
-- meaning the public anon key (shipped to every browser) could write them
-- directly:
--   - cafeterias.vendor_email / upi_id: the sole ownership check used by
--     vendor login and every vendor-scoped API route, and the payout
--     destination — writable by anyone = full vendor account takeover.
--   - cafeteria_menu.price: orders.total_amount is computed client-side from
--     this price and then trusted as the "authoritative" DB amount by
--     create-order/verify-payment, so a forged price is a forged payment.
--   - notifications: recipient_id carries student phone numbers; the whole
--     table was world-readable/writable.
--
-- This also fixes a bug in the 20260718 migration itself: it tried to drop
-- policies named "Public read audit" / "Manage audit" on manager_audit_log,
-- but the policies that actually exist (created in
-- add_cashfree_and_approval_flow.sql) are named "Public read audit log" /
-- "Create audit log". DROP POLICY IF EXISTS silently no-ops on a name that
-- doesn't exist, so the audit log was never actually locked down.
-- ============================================================

-- ---------- cafeterias: scope writes to the owning vendor ----------
drop policy if exists "Vendor manage cafeterias" on cafeterias;
drop policy if exists "Vendor update own cafeteria" on cafeterias;

create policy "Vendor update own cafeteria" on cafeterias
  for update
  using (
    vendor_email = public.current_email()
    or public.has_role('manager')
    or public.has_role('admin')
  );
-- No client-side insert/delete flow exists (cafeterias are provisioned via
-- scripts/* using the service-role key, which bypasses RLS) — leaving no
-- insert/delete policy blocks anon/authenticated writes entirely.

-- ---------- cafeteria_menu: scope vendor writes, guard the one public path ----------
drop policy if exists "Vendor manage menu" on cafeteria_menu;
drop policy if exists "Vendor insert own menu items" on cafeteria_menu;
drop policy if exists "Vendor delete own menu items" on cafeteria_menu;
drop policy if exists "Menu updates" on cafeteria_menu;

create policy "Vendor insert own menu items" on cafeteria_menu
  for insert
  with check (
    exists (
      select 1 from cafeterias c
      where c.id = cafeteria_menu.cafeteria_id
        and c.vendor_email = public.current_email()
    )
    or public.has_role('manager')
    or public.has_role('admin')
  );

create policy "Vendor delete own menu items" on cafeteria_menu
  for delete
  using (
    exists (
      select 1 from cafeterias c
      where c.id = cafeteria_menu.cafeteria_id
        and c.vendor_email = public.current_email()
    )
    or public.has_role('manager')
    or public.has_role('admin')
  );

-- Updates stay open at the RLS layer (using (true)) because
-- app/student/page.tsx's decrementMenuItemStock legitimately runs as an
-- unauthenticated guest customer, decrementing stock right after checkout.
-- RLS can't distinguish "decrement my own order's stock" from "rewrite the
-- price" at the row level, so the real guard is a trigger below: only the
-- owning vendor (or manager/admin, or the service role) may change anything
-- other than stock_quantity, and even a non-owner may only move it down.
create policy "Menu updates" on cafeteria_menu
  for update
  using (true);

create or replace function public.protect_menu_item_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner boolean;
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;

  select exists (
    select 1 from cafeterias c
    where c.id = NEW.cafeteria_id
      and c.vendor_email = public.current_email()
  ) into is_owner;

  if is_owner or public.has_role('manager') or public.has_role('admin') then
    return NEW;
  end if;

  -- Anyone else may only decrease stock_quantity; every other column
  -- (including price) is silently reset to its prior value rather than
  -- erroring, so a guest checkout's stock decrement still succeeds.
  if NEW.stock_quantity is null or OLD.stock_quantity is null or NEW.stock_quantity > OLD.stock_quantity then
    NEW.stock_quantity := OLD.stock_quantity;
  end if;
  NEW.name := OLD.name;
  NEW.description := OLD.description;
  NEW.price := OLD.price;
  NEW.category := OLD.category;
  NEW.is_veg := OLD.is_veg;
  NEW.image_url := OLD.image_url;
  NEW.is_available := OLD.is_available;
  NEW.cafeteria_id := OLD.cafeteria_id;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_menu_item_writes on cafeteria_menu;
create trigger trg_protect_menu_item_writes
  before update on cafeteria_menu
  for each row
  execute function public.protect_menu_item_writes();

-- ---------- cafeteria_queues: vendor-scoped manual override; trigger bypasses RLS ----------
drop policy if exists "Vendor manage queues" on cafeteria_queues;
drop policy if exists "Vendor update own queue" on cafeteria_queues;

create policy "Vendor update own queue" on cafeteria_queues
  for update
  using (
    exists (
      select 1 from cafeterias c
      where c.id = cafeteria_queues.cafeteria_id
        and c.vendor_email = public.current_email()
    )
    or public.has_role('manager')
    or public.has_role('admin')
  );

-- update_cafeteria_queue() fires on `orders` inserts/updates from guest
-- customers (placing an order) as well as vendors — it must bypass RLS to
-- keep working for the customer-triggered path now that direct client
-- writes to cafeteria_queues are scoped to the owning vendor.
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
$$ language plpgsql security definer set search_path = public;

-- ---------- token_sequences: no legitimate client access at all ----------
drop policy if exists "Public read token sequences" on token_sequences;
drop policy if exists "Manage token sequences" on token_sequences;
-- RLS stays enabled with zero anon/authenticated policies -> service-role
-- and SECURITY DEFINER functions only. The app never reads this table
-- directly; only generate_token_number() writes to it, from a trigger fired
-- by vendor-side order updates (approve/ready) — must bypass RLS the same
-- way update_cafeteria_queue() does.
create or replace function generate_token_number()
returns trigger as $$
declare
  token_num integer;
begin
  insert into token_sequences (cafeteria_id, current_token, reset_date)
  values (new.cafeteria_id, 1, current_date)
  on conflict (cafeteria_id) do update
  set current_token = case
        when token_sequences.reset_date < current_date then 1
        else token_sequences.current_token + 1
      end,
      reset_date = current_date
  returning current_token into token_num;

  new.token_number := token_num;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- notifications: service-role only ----------
-- lib/notifications.ts now writes through a service-role client (it only
-- ever runs server-side, in API routes); no legitimate anon/authenticated
-- path remains, so lock the table down entirely, same as payouts.
drop policy if exists "Public read notifications" on notifications;
drop policy if exists "Create notifications" on notifications;
drop policy if exists "Update notifications" on notifications;

-- ---------- manager_audit_log: fix the 20260718 name-mismatch bug ----------
-- The policies actually created (add_cashfree_and_approval_flow.sql) are
-- named differently from what 20260718_security_hardening.sql tried to drop,
-- so they were never removed. Drop them under their real names.
drop policy if exists "Public read audit log" on manager_audit_log;
drop policy if exists "Create audit log" on manager_audit_log;
