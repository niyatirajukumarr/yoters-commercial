-- Allow vendors to delete pending payment orders
-- Drop the old policy and create a new one that allows 'collected', 'pending', and 'payment_pending' statuses
drop policy if exists "Vendor delete collected orders" on orders;
drop policy if exists "Vendor delete collected and pending orders" on orders;

create policy "Vendor delete collected and pending payment orders" on orders
  for delete
  using (
    (status = 'collected' or status = 'pending' or status = 'payment_pending')
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
