// Update Lit Bites with image URL
// Run with: node scripts/update-cafe-image.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateCafeImage() {
  try {
    console.log('Updating Lit Bites image...')

    const { data, error } = await supabase
      .from('cafeterias')
      .update({
        image_url: 'https://images.unsplash.com/photo-1522868392303-b3e8e8c32d64?w=500&h=400&fit=crop'
      })
      .eq('name', 'Lit Bites Prof\'s Cafe')

    if (error) {
      console.error('Error updating image:', error)
      return
    }

    console.log('✅ Image updated successfully!')
  } catch (err) {
    console.error('Error:', err)
  }
}

updateCafeImage()
