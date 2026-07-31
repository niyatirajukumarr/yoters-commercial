-- Fix RLS policy to allow deleting payment_pending orders
-- Updates the vendor delete policy to include 'payment_pending' status
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
