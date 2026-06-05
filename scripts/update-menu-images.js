// Update Lit Bites menu items with food images
// Run with: node scripts/update-menu-images.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Food image URLs from Unsplash
const menuImages = {
  'Cold Coffee': 'https://images.unsplash.com/photo-1517701550927-30cf4ba36d5d?w=500&h=400&fit=crop',
  'Idli Sambar': 'https://images.unsplash.com/photo-1585518419759-64457e1dc75e?w=500&h=400&fit=crop',
  'Veg Fried Rice': 'https://images.unsplash.com/photo-1603894542582-f86cf4c8f5ad?w=500&h=400&fit=crop',
  'Egg Roll': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=400&fit=crop',
  'Biryani': 'https://images.unsplash.com/photo-1585518419759-64457e1dc75e?w=500&h=400&fit=crop',
  'Mandhi': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
  'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop',
  'Roll': 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b11?w=500&h=400&fit=crop',
  'Fries': 'https://images.unsplash.com/photo-1585238341710-4b51926b4b13?w=500&h=400&fit=crop',
  'Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=400&fit=crop',
  'Momo': 'https://images.unsplash.com/photo-1563245372-f403bf289096?w=500&h=400&fit=crop',
  'Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc3f6?w=500&h=400&fit=crop',
  'Juice': 'https://images.unsplash.com/photo-1553530666-ba953a5ad259?w=500&h=400&fit=crop',
}

async function updateMenuImages() {
  try {
    console.log('Fetching Lit Bites menu items...')

    const { data: cafeteria } = await supabase
      .from('cafeterias')
      .select('id')
      .eq('name', 'Lit Bites Prof\'s Cafe')
      .single()

    if (!cafeteria) {
      console.error('Lit Bites cafe not found')
      return
    }

    const { data: menuItems } = await supabase
      .from('cafeteria_menu')
      .select('id, name')
      .eq('cafeteria_id', cafeteria.id)

    if (!menuItems) {
      console.log('No menu items found')
      return
    }

    console.log(`Found ${menuItems.length} menu items. Updating with images...`)

    let updated = 0
    for (const item of menuItems) {
      // Find matching image URL
      let imageUrl = null
      for (const [keyword, url] of Object.entries(menuImages)) {
        if (item.name.toLowerCase().includes(keyword.toLowerCase())) {
          imageUrl = url
          break
        }
      }

      if (imageUrl) {
        const { error } = await supabase
          .from('cafeteria_menu')
          .update({ image_url: imageUrl })
          .eq('id', item.id)

        if (error) {
          console.error(`Error updating ${item.name}:`, error)
        } else {
          console.log(`✅ ${item.name} → image updated`)
          updated++
        }
      } else {
        console.log(`⚠️  ${item.name} → no matching image found`)
      }
    }

    console.log(`\n✅ Updated ${updated}/${menuItems.length} menu items with images!`)
  } catch (err) {
    console.error('Error:', err)
  }
}

updateMenuImages()
