-- ============================================================
-- Fix: profiles.role self-escalation
--
-- The 20260718 hardening migration made `orders`/`payouts` visibility
-- depend on has_role('admin'/'manager'), but never restricted who can
-- write profiles.role. The pre-existing "Users manage own profile"
-- policy is `for all using (auth.uid() = id)` with no column
-- restriction, so any authenticated user could run, from the browser,
-- against the public anon key + their own real session:
--
--   supabase.from('profiles').upsert({ id: myUserId, role: 'admin' })
--
-- ...and immediately gain has_role('admin') → full read access to every
-- order (name/phone/email/items/amounts for all users), re-opening the
-- exact hole the hardening migration closed, through a different door.
--
-- Fix: a BEFORE INSERT OR UPDATE trigger that only lets `role` be set to
-- something other than the safe default when the caller is either the
-- service-role (server-side admin actions) or an existing admin acting
-- through the client. Anyone else attempting to change it has the value
-- silently reset — the write still "succeeds" but role never changes,
-- so the response doesn't leak that a protection mechanism exists.
-- ============================================================

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No-op changes are always fine.
  if TG_OP = 'UPDATE' and NEW.role is not distinct from OLD.role then
    return NEW;
  end if;

  -- Server-side calls (API routes, admin scripts) use the service-role
  -- key, which bypasses RLS policies but NOT triggers — so this is the
  -- one path that must stay open for legitimate role assignment.
  if auth.role() = 'service_role' then
    return NEW;
  end if;

  -- An existing admin may change roles via an (future) admin UI.
  if public.has_role('admin') then
    return NEW;
  end if;

  -- Anyone else: the write proceeds, but role does not change.
  if TG_OP = 'UPDATE' then
    NEW.role := OLD.role;
  else
    NEW.role := 'student';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_profile_role on profiles;
create trigger trg_protect_profile_role
  before insert or update on profiles
  for each row
  execute function public.protect_profile_role();
