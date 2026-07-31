import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sql = `ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment', 'payment_pending', 'pending_approval', 'approved', 'preparing', 'ready', 'collected', 'cancelled', 'paid', 'pending'));`;

// Try to execute via a raw query using the supabase client
// This requires a stored procedure or function to exist
const { data, error } = await supabase.rpc('_execute_sql', {
  sql
}).then(
  r => r,
  e => ({ error: e })
);

if (error) {
  // Try alternative: update via PostgreSQL wire protocol
  console.log('Direct RPC failed, attempting migration push...');
  console.log('Error was:', error.message);
} else {
  console.log('Constraint fixed!', data);
}
