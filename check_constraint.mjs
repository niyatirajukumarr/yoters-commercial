import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase.rpc('get_check_constraint', {
  table_name: 'orders'
}).catch(() => null);

// Try a different approach - just query the information_schema
const { data: schema, error: schemaError } = await supabase
  .from('information_schema.table_constraints')
  .select('*')
  .eq('table_name', 'orders')
  .eq('constraint_type', 'CHECK');

console.log('Schema error:', schemaError);
console.log('Constraints:', schema);
