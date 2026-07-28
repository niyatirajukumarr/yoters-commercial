-- Payout ledger.
--
-- `payouts` existed but recorded almost nothing, and the payout route never
-- wrote to it. `total_paid` on the admin dashboard was hardcoded to 0, so
-- "Pending" always equalled "Received": pay a vendor today and tomorrow the
-- page still says the full amount is owed. Nothing prevented paying twice.
--
-- This turns the table into an actual ledger: one row per attempt, written
-- BEFORE money moves, so a payout can never happen without a trace.

alter table payouts
  -- Sent to Razorpay so a retry cannot create a second transfer.
  add column if not exists idempotency_key text,
  -- Razorpay's payout id, once it accepts the request.
  add column if not exists razorpay_payout_id text,
  -- Snapshot of the destination at the time of sending. The cafeteria's
  -- upi_id can be edited later; this records where the money actually went.
  add column if not exists upi_id text,
  add column if not exists initiated_by text,
  add column if not exists failure_reason text,
  add column if not exists updated_at timestamptz default now();

-- processing = sent to Razorpay, outcome not yet confirmed. It counts as spent
-- so the money cannot be sent twice while in doubt.
-- processed  = Razorpay accepted it.
-- failed     = rejected; does not count as spent.
-- reversed   = returned after the fact (e.g. bad VPA).
alter table payouts drop constraint if exists payouts_status_check;
alter table payouts add constraint payouts_status_check
  check (status in ('pending', 'processing', 'processed', 'failed', 'reversed'));

-- A retry with the same key must never become a second transfer.
create unique index if not exists uniq_payouts_idempotency_key
  on payouts (idempotency_key)
  where idempotency_key is not null;

-- Only one payout may be in flight per cafeteria. Two admins clicking at the
-- same moment would otherwise both read the same "pending" figure and both
-- send it — the check-then-act race. The second insert fails on this index.
create unique index if not exists uniq_payouts_inflight_per_cafeteria
  on payouts (cafeteria_id)
  where status = 'processing';

create index if not exists idx_payouts_cafeteria on payouts (cafeteria_id);
create index if not exists idx_payouts_status on payouts (status);

-- The 20260718 hardening dropped every policy on this table, leaving it
-- service-role only. Writes stay that way — payouts are only ever created by
-- the server route. But the admin dashboard reads totals in the browser, so
-- admins/managers need select, exactly as they have on `orders`.
alter table payouts enable row level security;
drop policy if exists "Admins read payouts" on payouts;
create policy "Admins read payouts" on payouts
  for select
  using (public.has_role('manager') or public.has_role('admin'));
