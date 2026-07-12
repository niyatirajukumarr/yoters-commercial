// Set all cafeterias as open
// Run with: node scripts/open-all-cafes.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function openAllCafes() {
  try {
    console.log('Opening all cafeterias...')

    // First, fetch all cafeterias
    const { data: allCafes, error: fetchError } = await supabase
      .from('cafeterias')
      .select('id, name')

    if (fetchError) {
      console.error('Error fetching cafes:', fetchError)
      return
    }

    console.log(`Found ${allCafes?.length} cafeterias`)

    // Update each one
    for (const cafe of allCafes) {
      const { error } = await supabase
        .from('cafeterias')
        .update({ is_open: true })
        .eq('id', cafe.id)

      if (error) {
        console.error(`Error opening ${cafe.name}:`, error)
      } else {
        console.log(`✅ ${cafe.name}`)
      }
    }

    console.log(`\n✅ All cafeterias are now open!`)
  } catch (err) {
    console.error('Error:', err)
  }
}

openAllCafes()
