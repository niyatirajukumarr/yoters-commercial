import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Update Niyati's order status to pending_approval
const { data, error } = await supabase
  .from('orders')
  .update({ status: 'pending_approval' })
  .eq('student_name', 'Niyati')
  .eq('status', 'paid')
  .select();

if (error) {
  console.log('Error:', error);
} else {
  console.log('Updated orders:', data.length);
  if (data.length > 0) {
    console.log(`  ${data[0].id.substring(0, 8)}... → pending_approval`);
  }
}
