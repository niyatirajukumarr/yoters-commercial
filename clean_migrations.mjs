import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all migrations
const { data, error } = await supabase
  .from('supabase_migrations.schema_migrations')
  .select('*');

if (error) {
  console.log('Error querying migrations:', error);
} else {
  console.log('Current migrations:');
  data.forEach(m => console.log(`  ${m.version} (${m.name})`));
  
  // The issue is duplicates - let's see if we can delete and re-insert
  console.log('\nThis table is managed by Supabase and should not be manually edited.');
  console.log('The constraint fix needs to be applied via a new migration with a higher version number.');
}
