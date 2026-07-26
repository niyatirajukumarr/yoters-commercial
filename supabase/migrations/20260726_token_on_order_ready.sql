-- Move token_number generation from vendor approval to "order ready".
-- Previously (20260722_token_on_vendor_approval.sql) it fired on
-- status -> 'approved'. Now it should only appear once the vendor has
-- actually finished preparing the order and marks it ready for pickup —
-- that's the moment the token is meant to represent.

drop trigger if exists generate_token_on_approval on orders;

create trigger generate_token_on_ready
before update on orders
for each row
when (old.status is distinct from 'ready' and new.status = 'ready' and new.token_number is null)
execute function generate_token_number();
