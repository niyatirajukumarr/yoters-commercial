-- 20260727_token_setup_complete.sql assumed token_sequences had columns
-- (cafeteria_id, date, next_token) with a composite primary key — that was
-- wrong. The table already existed in this database with a different shape:
-- (cafeteria_id primary key, current_token, reset_date) — one row per
-- cafeteria, not one row per cafeteria per day. `create table if not
-- exists` silently did nothing since the table was already there, so the
-- function kept referencing columns ("date", "next_token") that don't
-- exist, and every "Order is Ready" update was failing with
-- 42703 column "date" of relation "token_sequences" does not exist.
--
-- Rewritten to use the columns that actually exist, replicating the same
-- "reset daily, otherwise increment" behavior via reset_date instead of a
-- composite key.
create or replace function generate_token_number()
returns trigger as $$
declare
  token_num integer;
begin
  insert into token_sequences (cafeteria_id, current_token, reset_date)
  values (new.cafeteria_id, 1, current_date)
  on conflict (cafeteria_id) do update
  set current_token = case
        when token_sequences.reset_date < current_date then 1
        else token_sequences.current_token + 1
      end,
      reset_date = current_date
  returning current_token into token_num;

  new.token_number := token_num;
  return new;
end;
$$ language plpgsql;
