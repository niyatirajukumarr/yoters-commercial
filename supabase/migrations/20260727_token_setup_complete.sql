-- Consolidated, idempotent setup for the token_number system.
--
-- supabase/add_token_sequence.sql (the file that originally defined
-- generate_token_number(), the token_sequences table, and the token_number
-- column) was apparently never applied to this database — hence "function
-- generate_token_number() does not exist" when a later migration tried to
-- reference it. This script does everything from scratch, safe to run even
-- if some pieces already exist.

alter table orders add column if not exists token_number integer unique;

create table if not exists token_sequences (
  cafeteria_id uuid references cafeterias(id) on delete cascade,
  date date not null default current_date,
  next_token integer not null default 1,
  primary key (cafeteria_id, date)
);

create or replace function generate_token_number()
returns trigger as $$
declare
  token_num integer;
begin
  insert into token_sequences (cafeteria_id, date, next_token)
  values (new.cafeteria_id, current_date, 2)
  on conflict (cafeteria_id, date) do update
  set next_token = token_sequences.next_token + 1
  returning (token_sequences.next_token - 1) into token_num;

  new.token_number := token_num;
  return new;
end;
$$ language plpgsql;

-- Only one of these should ever be active — drop every earlier version
-- before creating the current one, so this can't leave two triggers firing
-- at different points (which would generate the token at the wrong time).
drop trigger if exists generate_token_on_payment on orders;
drop trigger if exists generate_token_on_approval on orders;
drop trigger if exists generate_token_on_ready on orders;

create trigger generate_token_on_ready
before update on orders
for each row
when (old.status is distinct from 'ready' and new.status = 'ready' and new.token_number is null)
execute function generate_token_number();
