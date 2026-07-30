-- Allow vendors to delete pending payment orders
-- Drop the old policy and create a new one that allows both 'collected' and 'pending' statuses
drop policy if exists "Vendor delete collected orders" on orders;

create policy "Vendor delete collected and pending orders" on orders
  for delete
  using (
    (status = 'collected' or status = 'pending')
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
