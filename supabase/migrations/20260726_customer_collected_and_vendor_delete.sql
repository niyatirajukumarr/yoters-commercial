-- Lets a customer flag "I've collected this" from the tracking page (visible
-- to the vendor as a nudge, doesn't change order.status itself — the vendor
-- still owns the actual "Mark as Collected" transition, same as before), and
-- lets the vendor delete an order once it's actually collected.

alter table orders
  add column if not exists customer_marked_collected_at timestamptz;

-- SECURITY DEFINER so the ownership check runs with elevated privileges
-- (needed to read `profiles` for current_phone()), but the function itself
-- is what enforces that the caller owns this specific order — a customer
-- can only ever flag their own ready order, nothing else.
create or replace function public.mark_order_collected_by_customer(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set customer_marked_collected_at = now()
  where id = p_order_id
    and status = 'ready'
    and customer_marked_collected_at is null
    and (
      (student_phone is not null and student_phone = public.current_phone())
      or (student_email is not null and student_email = public.current_email())
    );
end;
$$;

grant execute on function public.mark_order_collected_by_customer(uuid) to authenticated;

-- Only once an order is actually collected can the owning vendor delete it.
create policy "Vendor delete collected orders" on orders
  for delete
  using (
    status = 'collected'
    and (
      exists (
        select 1 from cafeterias c
        where c.id = orders.cafeteria_id
          and c.vendor_email = public.current_email()
      )
      or public.has_role('manager')
      or public.has_role('admin')
    )
  );
