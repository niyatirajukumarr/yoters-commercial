// Populate Lit Bites menu with all items from the menu image
// Run with: node scripts/populate-lit-bites-menu.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Menu items with images
const menuItems = [
  // BIRYANI
  { name: 'Chicken Dum', category: 'Biryani', price: 130, description: 'Authentic chicken biryani' },
  { name: 'Chicken Fried Biryani', category: 'Biryani', price: 135, description: 'Fried chicken biryani' },
  { name: 'Loaded Biryani', category: 'Biryani', price: 180, description: 'Extra loaded biryani' },

  // MANDHI
  { name: 'Mandhi - Normal', category: 'Mandhi', price: 169, description: 'Traditional mandhi rice' },
  { name: 'Mandhi - Alfadam', category: 'Mandhi', price: 210, description: 'Mandhi with alfadam' },

  // COMBO
  { name: 'Ghee Rice and Chicken', category: 'Combo', price: 130, description: 'Ghee rice with chicken' },
  { name: 'Porotta and Chicken', category: 'Combo', price: 100, description: 'Parotta with chicken' },
  { name: 'Pathiri and Chicken', category: 'Combo', price: 110, description: 'Pathiri with chicken' },
  { name: 'Meenum Chorum', category: 'Combo', price: 120, description: 'Special fish dish' },

  // ALFAHAM
  { name: 'Alfaham - Normal', category: 'Alfaham', price: 130, description: 'Grilled chicken alfaham' },
  { name: 'Alfaham - Mango Chilli', category: 'Alfaham', price: 140, description: 'Spicy mango alfaham' },
  { name: 'Alfaham - Honey Chilli', category: 'Alfaham', price: 140, description: 'Sweet honey alfaham' },
  { name: 'Alfaham - Peri Peri', category: 'Alfaham', price: 140, description: 'Peri peri spiced alfaham' },
  { name: 'Alfaham - Tandhari', category: 'Alfaham', price: 140, description: 'Tandhari spiced alfaham' },
  { name: 'Alfaham - Garlic Magic', category: 'Alfaham', price: 150, description: 'Garlic flavored alfaham' },
  { name: 'Alfaham - Crazy Creamy', category: 'Alfaham', price: 170, description: 'Creamy alfaham' },
  { name: 'Alfaham - Cheese Buster', category: 'Alfaham', price: 170, description: 'Cheese loaded alfaham' },
  { name: 'Alfaham - Korean', category: 'Alfaham', price: 170, description: 'Korean style alfaham' },
  { name: 'Alfaham - Infused', category: 'Alfaham', price: 170, description: 'Special infused alfaham' },

  // BURGER
  { name: 'Burger - Normal', category: 'Burger', price: 69, description: 'Classic burger' },
  { name: 'Burger - Veg', category: 'Burger', price: 59, description: 'Vegetarian burger' },
  { name: 'Burger - Double Patty', category: 'Burger', price: 109, description: 'Double patty burger' },
  { name: 'Burger - Fresh Patty', category: 'Burger', price: 149, description: 'Fresh made patty burger' },
  { name: 'Burger - Alfaham', category: 'Burger', price: 149, description: 'Alfaham burger' },

  // ROLL
  { name: 'Roll - Small', category: 'Roll', price: 69, description: 'Small roll' },
  { name: 'Roll - Crispy', category: 'Roll', price: 89, description: 'Crispy roll' },
  { name: 'Roll - Mega', category: 'Roll', price: 149, description: 'Mega sized roll' },

  // FRIES
  { name: 'Fries - Normal', category: 'Fries', price: 49, description: 'Regular fries' },
  { name: 'Fries - Peri Peri', category: 'Fries', price: 59, description: 'Peri peri fries' },
  { name: 'Fries - Masala', category: 'Fries', price: 69, description: 'Masala fries' },
  { name: 'Fries - Loaded', category: 'Fries', price: 149, description: 'Loaded fries' },

  // DRINKS
  { name: 'Mojito - Blue', category: 'Drinks', price: 79, description: 'Blue mojito' },
  { name: 'Lime - Regular', category: 'Drinks', price: 25, description: 'Regular lime drink' },
  { name: 'Lime - Soda', category: 'Drinks', price: 40, description: 'Lime with soda' },
  { name: 'Lime - Mint', category: 'Drinks', price: 35, description: 'Lime with mint' },
  { name: 'Masala Soda', category: 'Drinks', price: 69, description: 'Spicy masala soda' },
  { name: 'Bomb Soda', category: 'Drinks', price: 69, description: 'Special bomb soda' },

  // MOMOS
  { name: 'Momo - Fried', category: 'Momos', price: 79, description: 'Fried momos' },
  { name: 'Momo - Juicy', category: 'Momos', price: 89, description: 'Juicy momos' },

  // COFFEE
  { name: 'Coffee - Cold', category: 'Coffee', price: 69, description: 'Cold coffee' },
  { name: 'Coffee - Normal', category: 'Coffee', price: 49, description: 'Hot coffee' },
  { name: 'Coffee - Small', category: 'Coffee', price: 20, description: 'Small coffee' },

  // SHAKES @ 99
  { name: 'Shake - Chikoo', category: 'Shakes', price: 99, description: 'Chikoo shake' },
  { name: 'Shake - Apple', category: 'Shakes', price: 99, description: 'Apple shake' },
  { name: 'Shake - Mango', category: 'Shakes', price: 99, description: 'Mango shake' },
  { name: 'Shake - Sharja', category: 'Shakes', price: 99, description: 'Sharja shake' },
  { name: 'Shake - Avocado', category: 'Shakes', price: 99, description: 'Avocado shake' },

  // SHAKES @ 79
  { name: 'Shake - Oreo', category: 'Shakes', price: 79, description: 'Oreo shake' },
  { name: 'Shake - Kitkat', category: 'Shakes', price: 79, description: 'Kitkat shake' },

  // JUICE @ 59
  { name: 'Juice - Orange', category: 'Juice', price: 59, description: 'Fresh orange juice' },
  { name: 'Juice - Pineapple', category: 'Juice', price: 59, description: 'Fresh pineapple juice' },
  { name: 'Juice - Watermelon', category: 'Juice', price: 59, description: 'Fresh watermelon juice' },
  { name: 'Juice - Grape', category: 'Juice', price: 59, description: 'Fresh grape juice' },
]

async function populateMenu() {
  try {
    console.log('Finding Lit Bites cafe...')

    const { data: cafeteria, error: cafeError } = await supabase
      .from('cafeterias')
      .select('id')
      .eq('name', 'Lit Bites Prof\'s Cafe')
      .single()

    if (cafeError || !cafeteria) {
      console.error('Lit Bites cafe not found')
      return
    }

    console.log(`Found Lit Bites (ID: ${cafeteria.id})`)

    // Delete existing menu items
    console.log('Clearing existing menu items...')
    const { error: deleteError } = await supabase
      .from('cafeteria_menu')
      .delete()
      .eq('cafeteria_id', cafeteria.id)

    if (deleteError) {
      console.error('Error deleting items:', deleteError)
    }

    // Insert new menu items
    console.log(`Inserting ${menuItems.length} menu items...`)

    const itemsToInsert = menuItems.map(item => ({
      cafeteria_id: cafeteria.id,
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      is_available: true,
    }))

    const { error: insertError, data: inserted } = await supabase
      .from('cafeteria_menu')
      .insert(itemsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting items:', insertError)
      return
    }

    console.log(`✅ Successfully added ${inserted?.length || itemsToInsert.length} menu items to Lit Bites!`)
  } catch (err) {
    console.error('Error:', err)
  }
}

populateMenu()
