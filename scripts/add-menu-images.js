// Add images to Lit Bites menu items
// Run with: node scripts/add-menu-images.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Image mapping by category and keywords
const imageMap = {
  'Biryani': 'https://images.unsplash.com/photo-1589273979235-30b96e2254f0?w=500&h=400&fit=crop',
  'Mandhi': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
  'Combo': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
  'Alfaham': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=400&fit=crop',
  'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop',
  'Roll': 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b11?w=500&h=400&fit=crop',
  'Fries': 'https://images.unsplash.com/photo-1585238341710-4b51926b4b13?w=500&h=400&fit=crop',
  'Drinks': 'https://images.unsplash.com/photo-1608270861620-7d5f2e2b5c69?w=500&h=400&fit=crop',
  'Momos': 'https://images.unsplash.com/photo-1563245372-f403bf289096?w=500&h=400&fit=crop',
  'Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=400&fit=crop',
  'Shakes': 'https://images.unsplash.com/photo-1572490122747-3968b75cc3f6?w=500&h=400&fit=crop',
  'Juice': 'https://images.unsplash.com/photo-1553530666-ba953a5ad259?w=500&h=400&fit=crop',
}

async function addImages() {
  try {
    console.log('Finding Lit Bites menu items...')

    const { data: cafeteria } = await supabase
      .from('cafeterias')
      .select('id')
      .eq('name', 'Lit Bites Prof\'s Cafe')
      .single()

    if (!cafeteria) {
      console.error('Lit Bites not found')
      return
    }

    const { data: menuItems } = await supabase
      .from('cafeteria_menu')
      .select('id, name, category')
      .eq('cafeteria_id', cafeteria.id)

    console.log(`Found ${menuItems?.length} items. Adding images...`)

    let updated = 0
    for (const item of menuItems || []) {
      const imageUrl = imageMap[item.category] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop'

      const { error } = await supabase
        .from('cafeteria_menu')
        .update({ image_url: imageUrl })
        .eq('id', item.id)

      if (error) {
        console.error(`Error updating ${item.name}:`, error)
      } else {
        console.log(`✅ ${item.name}`)
        updated++
      }
    }

    console.log(`\n✅ Added images to ${updated} menu items!`)
  } catch (err) {
    console.error('Error:', err)
  }
}

addImages()
