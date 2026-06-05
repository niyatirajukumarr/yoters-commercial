// Upload Lit Bites image to Supabase storage
// Run with: node scripts/upload-lit-bites-image.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey)

async function uploadImage() {
  try {
    const imagePath = 'C:\\Users\\NIYATI RAJUKUMAR\\Downloads\\lit bites.webp'

    if (!fs.existsSync(imagePath)) {
      console.error('Image file not found:', imagePath)
      return
    }

    console.log('Reading image file...')
    const imageBuffer = fs.readFileSync(imagePath)
    const fileName = 'lit-bites-prof-cafe.webp'
    const bucketName = 'cafeteria-images'

    console.log('Uploading to Supabase storage...')
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`public/${fileName}`, imageBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return
    }

    console.log('✅ Image uploaded successfully!')
    console.log('File path:', data.path)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`public/${fileName}`)

    console.log('Public URL:', publicUrl)

    // Update database with image URL
    console.log('Updating database record...')
    const { error: updateError } = await supabase
      .from('cafeterias')
      .update({ image_url: publicUrl })
      .eq('name', 'Lit Bites Prof\'s Cafe')

    if (updateError) {
      console.error('Database update error:', updateError)
      return
    }

    console.log('✅ Database updated successfully!')
    console.log('Image URL saved to database')
  } catch (err) {
    console.error('Error:', err)
  }
}

uploadImage()
