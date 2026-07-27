-- Unpaid-order flow: a customer can cancel an order they never paid for
-- (mistake or change of mind), the vendor sees it happened and why, and can
-- then delete it. Also tracks when a vendor sends a "remind to pay" so the
-- customer's own order card can say so.

alter table orders
  add column if not exists payment_reminder_sent_at timestamptz;

-- SECURITY DEFINER so the ownership check (needs to read `profiles` for
-- current_phone()) runs with elevated privileges — the function itself is
-- what restricts a customer to cancelling only their own, still-unpaid order.
create or replace function public.cancel_order_by_customer(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set status = 'cancelled',
      denial_reason = 'Customer cancelled before payment',
      denied_at = now()
  where id = p_order_id
    and status = 'pending'
    and (
      (student_phone is not null and student_phone = public.current_phone())
      or (student_email is not null and student_email = public.current_email())
    );
end;
$$;

grant execute on function public.cancel_order_by_customer(uuid) to authenticated;

-- Previously only 'collected' orders were deletable by the owning vendor.
-- Extend to 'cancelled' too, so a customer-cancelled unpaid order can be
-- cleared out the same way.
drop policy if exists "Vendor delete collected orders" on orders;

create policy "Vendor delete collected or cancelled orders" on orders
  for delete
  using (
    status in ('collected', 'cancelled')
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
