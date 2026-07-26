-- Orders had no DELETE policy at all — with RLS enabled and no matching
-- policy, a client-side delete() silently affects 0 rows and reports no
-- error, so the "Delete Order" button only ever removed the order from
-- local state. It reappeared on refresh/re-login because the DB row was
-- never actually touched. Add ownership-scoped delete, restricted to
-- orders already in a terminal state (mirrors the client-side gating in
-- app/profile/page.tsx, enforced here too so it can't be bypassed by
-- calling the API directly).
create policy "Owner delete past orders" on orders
  for delete
  using (
    status in ('cancelled', 'collected')
    and (
      (student_phone is not null and student_phone = public.current_phone())
      or (student_email is not null and student_email = public.current_email())
    )
  );
