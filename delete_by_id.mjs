import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Delete by ID
const { error } = await supabase
  .from('orders')
  .delete()
  .eq('id', '7fe14ff2-02a2-4738-ba42-e475ba1bb6cb');

if (error) {
  console.log('Delete error:', error.message);
} else {
  console.log('Order deleted successfully');
}
