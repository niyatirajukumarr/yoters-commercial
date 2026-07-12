// Simple script to update cafeteria details
// Run with: node scripts/update-cafeteria.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateCafeteria() {
  try {
    console.log('Updating cafeteria record...')

    const { data, error } = await supabase
      .from('cafeterias')
      .update({
        name: 'Lit Bites Prof\'s Cafe',
        location: 'Achith Nagar, 3rd Cross',
        vendor_email: 'nn3079865@gmail.com',
        upi_id: 'Q3322303356@ybl',
        description: 'Good food, good mood, good vibes! Pocket-friendly prices with big portions. Maximum satisfaction guaranteed 😋',
        image_emoji: null,
      })
      .eq('name', 'engineering block')

    if (error) {
      console.error('Error updating cafeteria:', error)
      return
    }

    console.log('✅ Cafeteria updated successfully!')
    console.log('Updated records:', data)
  } catch (err) {
    console.error('Error:', err)
  }
}

updateCafeteria()
