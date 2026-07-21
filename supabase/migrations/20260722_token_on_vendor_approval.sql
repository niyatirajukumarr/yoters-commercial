-- ============================================================
-- Move token_number generation from payment to vendor approval
--
-- Previously generate_token_number() fired when payment_status went
-- unpaid -> paid (supabase/add_token_sequence.sql). The token is meant to
-- double as the vendor's confirmation that they've seen and accepted the
-- order, not just proof of payment, so it should only appear once the
-- vendor approves (status -> 'approved' in app/api/vendor/approve-order).
--
-- Apply this in the Supabase SQL editor AFTER reviewing.
-- ============================================================

drop trigger if exists generate_token_on_payment on orders;

create trigger generate_token_on_approval
before update on orders
for each row
when (old.status is distinct from 'approved' and new.status = 'approved' and new.token_number is null)
execute function generate_token_number();
