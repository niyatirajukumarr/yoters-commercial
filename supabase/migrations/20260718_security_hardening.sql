-- ============================================================
-- Security hardening migration
-- Addresses: M1 (order-tracking IDOR) and L4 (hardcoded identity / role model)
--
-- Apply this in the Supabase SQL editor AFTER reviewing. It tightens the
-- world-readable order policies and introduces a DB-backed role model so the
-- app no longer trusts `orders` reads by id alone or hardcoded admin emails.
--
-- NOTE: this supersedes the permissive `using (true)` order policies. Guest
-- (unauthenticated) order tracking must go through a server route that uses the
-- service-role key — client-side anon reads of arbitrary orders are intentionally
-- no longer permitted.
-- ============================================================

-- ---------- L4: role model on profiles ----------
-- A `role` claim replaces scattered email literals. `isAdmin`/`isManager` in the
-- app read an env allowlist for UI gating; this column is the authoritative
-- server-side source and can back future RLS/role checks.
alter table profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'vendor', 'manager', 'admin'));

create index if not exists idx_profiles_role on profiles(role);

-- Helper: does the current authenticated user hold a given role?
create or replace function public.has_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$;

-- Helper: email of the current authenticated user (from the JWT).
create or replace function public.current_email()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'email', '');
$$;

-- ---------- M1: scope order reads to owner / owning vendor ----------
-- Remove the permissive policies that allowed anyone to read/update any order.
drop policy if exists "Public read orders" on orders;
drop policy if exists "Update orders" on orders;

-- Owners (authenticated) may read their own orders, matched by the email they
-- placed the order with. Vendors may read orders for the cafeteria they own.
-- Managers/admins may read all. The service-role key (used by API routes and
-- webhooks) bypasses RLS entirely, so server flows are unaffected.
create policy "Owner or vendor read orders" on orders
  for select
  using (
    (student_email is not null and student_email = public.current_email())
    or exists (
      select 1 from cafeterias c
      where c.id = orders.cafeteria_id
        and c.vendor_email = public.current_email()
    )
    or public.has_role('manager')
    or public.has_role('admin')
  );

-- Only the owning vendor (or manager/admin) may update an order from the client.
-- All privileged state changes (payment/refund) already run server-side with the
-- service-role key.
create policy "Vendor update orders" on orders
  for update
  using (
    exists (
      select 1 from cafeterias c
      where c.id = orders.cafeteria_id
        and c.vendor_email = public.current_email()
    )
    or public.has_role('manager')
    or public.has_role('admin')
  );

-- Order inserts remain open (guests place orders); the API validates contents.
-- (Existing "Customers place orders" INSERT policy is left in place.)

-- ---------- R5: payout / audit tables are service-role only ----------
-- The permissive payout policies allowed anon read/write of financial rows.
-- Remove them entirely: payouts are only ever touched by server routes using the
-- service-role key, which bypasses RLS. With RLS enabled and no policy, anon/
-- authenticated clients get zero access.
drop policy if exists "Public read payouts" on payouts;
drop policy if exists "Manage payouts" on payouts;

-- manager_audit_log has RLS enabled and (intentionally) no policy → service-role
-- only. This statement is a no-op safety net in case a permissive one was added.
drop policy if exists "Public read audit" on manager_audit_log;
drop policy if exists "Manage audit" on manager_audit_log;
