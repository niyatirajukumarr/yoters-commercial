import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('orders')
  .select('id, student_name, status, total_amount, created_at')
  .eq('student_name', 'Niyati')
  .order('created_at', { ascending: false });

if (error) {
  console.log('Error:', error);
} else {
  console.log('Niyati orders:');
  data.forEach(o => {
    console.log(`  ${o.id.substring(0, 8)}... | ${o.status} | ₹${o.total_amount} | ${o.created_at}`);
  });
}
