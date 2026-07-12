-- ============================================
-- Add Token Number Generation to Yoters
-- Run this in Supabase SQL Editor
-- ============================================

-- Add token_number column to orders table (if it doesn't exist)
alter table orders add column if not exists token_number integer unique;

-- Create sequence per cafeteria (reset daily)
create table if not exists token_sequences (
  cafeteria_id uuid references cafeterias(id) on delete cascade,
  date date not null default current_date,
  next_token integer not null default 1,
  primary key (cafeteria_id, date)
);

-- Function to generate sequential token numbers
create or replace function generate_token_number()
returns trigger as $$
declare
  token_num integer;
begin
  -- Get next token for this cafeteria today
  insert into token_sequences (cafeteria_id, date, next_token)
  values (new.cafeteria_id, current_date, 2)
  on conflict (cafeteria_id, date) do update
  set next_token = token_sequences.next_token + 1
  returning (token_sequences.next_token - 1) into token_num;

  -- Assign token to order
  new.token_number := token_num;

  return new;
end;
$$ language plpgsql;

-- Trigger to auto-generate token when order is marked as paid
drop trigger if exists generate_token_on_payment on orders;
create trigger generate_token_on_payment
before update on orders
for each row
when (old.payment_status = 'unpaid' and new.payment_status = 'paid' and new.token_number is null)
execute function generate_token_number();
