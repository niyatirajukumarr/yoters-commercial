// Add image_url column to cafeterias table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addImageColumn() {
  try {
    console.log('Adding image_url column to cafeterias table...')

    const { error } = await supabase.rpc('alter_table', {
      table_name: 'cafeterias',
      column_name: 'image_url',
      column_type: 'text'
    })

    if (error && error.code !== 'PGRST204') {
      console.error('Error:', error)
      return
    }

    // Try using raw SQL instead via the admin endpoint
    const { data, error: sqlError } = await supabase
      .from('cafeterias')
      .select()
      .limit(1)

    if (!sqlError) {
      console.log('Cafeterias table structure:')
      if (data && data.length > 0) {
        console.log(Object.keys(data[0]))
      }
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

addImageColumn()
