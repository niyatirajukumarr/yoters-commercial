// Add more cafeterias with different images
// Run with: node scripts/add-more-cafes.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const cafeterias = [
  {
    name: 'North Campus Food Court',
    location: 'North Campus, Near Library',
    description: 'Wide variety of cuisines with cozy seating. Fresh ingredients, quick service.',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop',
    vendor_email: 'north@yoters.com'
  },
  {
    name: 'Main Block Cafeteria',
    location: 'Main Block, Ground Floor',
    description: 'Traditional campus favorite. Best dosas and sambar in town!',
    image_url: 'https://images.unsplash.com/photo-1585238341710-4b51926b4b13?w=500&h=400&fit=crop',
    vendor_email: 'main@yoters.com'
  },
  {
    name: 'Lit Bites Prof\'s Cafe',
    location: 'Achith Nagar, 3rd Cross',
    description: 'Good food, good mood, good vibes! Pocket-friendly prices with big portions.',
    image_url: 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/cafeteria-images/public/lit-bites-prof-cafe.webp',
    vendor_email: 'nn3079865@gmail.com'
  },
  {
    name: 'Tech Cafe Hub',
    location: 'Tech Block, 2nd Floor',
    description: 'Modern cafe with healthy options. Perfect for lunch breaks between classes.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    vendor_email: 'tech@yoters.com'
  },
  {
    name: 'Spice Kitchen',
    location: 'Commerce Block, Basement',
    description: 'Aromatic spices, authentic recipes. Indian cuisine at its best!',
    image_url: 'https://images.unsplash.com/photo-1589273979235-30b96e2254f0?w=500&h=400&fit=crop',
    vendor_email: 'spice@yoters.com'
  },
  {
    name: 'The Grill House',
    location: 'Sports Complex, Near Gym',
    description: 'Grilled specialties and BBQ favorites. High protein, delicious meals.',
    image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=400&fit=crop',
    vendor_email: 'grill@yoters.com'
  },
  {
    name: 'Pasta Paradise',
    location: 'Arts Block, 3rd Floor',
    description: 'Italian pasta and continental dishes. Fresh and made to order.',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&h=400&fit=crop',
    vendor_email: 'pasta@yoters.com'
  },
  {
    name: 'Fresh & Healthy',
    location: 'Medical Block, Cafeteria Wing',
    description: 'Salads, smoothies, and nutritious bowls. Eat healthy, feel great!',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    vendor_email: 'healthy@yoters.com'
  },
]

async function addCafeterias() {
  try {
    console.log('Updating/Adding cafeterias...')

    for (const cafe of cafeterias) {
      // Check if exists
      const { data: existing } = await supabase
        .from('cafeterias')
        .select('id')
        .eq('name', cafe.name)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('cafeterias')
          .update({
            location: cafe.location,
            description: cafe.description,
            image_url: cafe.image_url,
            vendor_email: cafe.vendor_email,
            is_open: true,
          })
          .eq('id', existing.id)

        if (error) {
          console.error(`Error updating ${cafe.name}:`, error)
        } else {
          console.log(`✅ Updated: ${cafe.name}`)
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('cafeterias')
          .insert([{
            name: cafe.name,
            location: cafe.location,
            description: cafe.description,
            image_url: cafe.image_url,
            vendor_email: cafe.vendor_email,
            image_emoji: '🍽️',
            is_open: true,
          }])

        if (error) {
          console.error(`Error adding ${cafe.name}:`, error)
        } else {
          console.log(`✅ Added: ${cafe.name}`)
        }
      }
    }

    console.log('\n✅ All cafeterias processed successfully!')
  } catch (err) {
    console.error('Error:', err)
  }
}

addCafeterias()
