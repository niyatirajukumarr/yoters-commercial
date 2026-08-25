-- Tokens were a plain per-cafeteria daily counter (1, 2, 3...) via
-- token_sequences, displayed padded to 2 digits. Switching to a random
-- 3-digit token (100-999) per cafeteria per day, per the owner's request
-- for "unique 3 digit token numbers ... for all restaurants" rather than
-- low sequential numbers that only looked 3-digit once past order #99.
--
-- token_sequences (a single running counter per cafeteria) can't express
-- "which numbers are already taken today", so collision-checking now reads
-- directly from orders instead. "Today" is scoped to ready_at rather than
-- created_at, since a token represents the moment the vendor marks the
-- order ready, not when it was placed (an order placed late one day can be
-- fulfilled the next) — matching the original trigger's intent of a token
-- sequence page tied to generation day, not order day. ready_at was a
-- schema column no code ever populated; this trigger now sets it.
--
-- token_sequences itself is left in place (unused after this) rather than
-- dropped, since nothing here needs to touch it and dropping isn't this
-- change's job.

create or replace function generate_token_number()
returns trigger as $$
declare
  candidate integer;
  attempts integer := 0;
begin
  new.ready_at := coalesce(new.ready_at, now());

  loop
    attempts := attempts + 1;
    if attempts > 50 then
      raise exception 'Could not find a free 3-digit token for cafeteria % today', new.cafeteria_id;
    end if;

    candidate := 100 + floor(random() * 900)::integer;

    exit when not exists (
      select 1 from orders
      where cafeteria_id = new.cafeteria_id
        and token_number = candidate
        and ready_at::date = current_date
    );
  end loop;

  new.token_number := candidate;
  return new;
end;
$$ language plpgsql;
