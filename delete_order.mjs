import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Find Niyati's pending_approval order
const { data, error } = await supabase
  .from('orders')
  .select('id, student_name, status, total_amount, created_at')
  .eq('student_name', 'Niyati')
  .eq('status', 'pending_approval')
  .order('created_at', { ascending: false })
  .limit(1);

if (error) {
  console.log('Query error:', error);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log('No pending_approval order found for Niyati');
  process.exit(1);
}

const order = data[0];
console.log('Found order:', order.id, order.student_name, order.status);

// Delete it
const { error: deleteError } = await supabase
  .from('orders')
  .delete()
  .eq('id', order.id);

if (deleteError) {
  console.log('Delete error:', deleteError);
  process.exit(1);
}

console.log('Order deleted:', order.id);
