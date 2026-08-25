-- generate_token_number() (20260830_random_3digit_tokens.sql) checks, on
-- every "Order is Ready" click, whether a candidate token is already taken
-- today for this cafeteria:
--   where cafeteria_id = ... and token_number = ... and ready_at::date = current_date
-- Nothing indexed that combination, so each of its (up to 50) retry
-- attempts was a sequential scan over orders. This index backs that exact
-- lookup.

create index if not exists idx_orders_cafeteria_ready_token
  on orders (cafeteria_id, token_number)
  include (ready_at);
