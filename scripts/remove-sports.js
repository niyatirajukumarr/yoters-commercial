// Remove Sports Block Snack Bar from database
// Run with: node scripts/remove-sports.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function removeSports() {
  try {
    console.log('Removing Sports Block Snack Bar...')

    const { data, error } = await supabase
      .from('cafeterias')
      .delete()
      .eq('name', 'Sports Block Snack Bar')

    if (error) {
      console.error('Error removing cafeteria:', error)
      return
    }

    console.log('✅ Sports Block Snack Bar removed successfully!')
  } catch (err) {
    console.error('Error:', err)
  }
}

removeSports()
