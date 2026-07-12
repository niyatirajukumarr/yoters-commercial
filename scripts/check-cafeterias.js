// Check all cafeterias in the database
// Run with: node scripts/check-cafeterias.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCafeterias() {
  try {
    console.log('Fetching all cafeterias...')

    const { data, error } = await supabase
      .from('cafeterias')
      .select('id, name, location, vendor_email')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cafeterias:', error)
      return
    }

    console.log('\n📍 Cafeterias in database:')
    console.log('---')
    data.forEach((cafe, index) => {
      console.log(`${index + 1}. ${cafe.name}`)
      console.log(`   ID: ${cafe.id}`)
      console.log(`   Location: ${cafe.location}`)
      console.log(`   Email: ${cafe.vendor_email}`)
      console.log('')
    })
  } catch (err) {
    console.error('Error:', err)
  }
}

checkCafeterias()
