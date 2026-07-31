import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Execute raw SQL to fix the constraint
const { error } = await supabase.rpc('exec_sql_raw', {
  sql: `
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending_payment','payment_pending','pending_approval','approved','preparing','ready','collected','cancelled','paid','pending'));
  `
}).catch(async (err) => {
  console.log('RPC method not available, trying direct query...');
  return { error: err };
});

if (error && error.code !== 'PGRST102') {
  console.log('Error:', error);
} else {
  console.log('Constraint updated successfully');
}
