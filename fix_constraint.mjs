import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Drop and recreate the constraint with all valid statuses
const { error } = await supabase.rpc('exec_sql', {
  sql: `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment','payment_pending','pending_approval','approved','preparing','ready','collected','cancelled','paid'));`
}).catch(async () => {
  // If rpc doesn't work, try direct query
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment','payment_pending','pending_approval','approved','preparing','ready','collected','cancelled','paid'));`
      })
    }
  );
  return response.json();
});

if (error) {
  console.log('Error:', error);
} else {
  console.log('Constraint updated successfully');
}
