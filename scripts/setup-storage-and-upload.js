// Setup storage bucket and upload image
// Run with: node scripts/setup-storage-and-upload.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAndUpload() {
  try {
    const imagePath = 'C:\\Users\\NIYATI RAJUKUMAR\\Downloads\\lit bites.webp'
    const bucketName = 'cafeteria-images'

    if (!fs.existsSync(imagePath)) {
      console.error('Image file not found:', imagePath)
      return
    }

    console.log('Reading image file...')
    const imageBuffer = fs.readFileSync(imagePath)
    const fileName = 'lit-bites-prof-cafe.webp'

    console.log('Uploading image...')
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`public/${fileName}`, imageBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp'
      })

    if (uploadError) {
      // If bucket doesn't exist, try creating it
      if (uploadError.statusCode === '404') {
        console.log('Bucket not found, creating...')
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        })

        if (createError) {
          console.error('Bucket creation error:', createError)
          return
        }

        console.log('Bucket created, uploading image...')
        const { data: uploadData, error: uploadError2 } = await supabase.storage
          .from(bucketName)
          .upload(`public/${fileName}`, imageBuffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp'
          })

        if (uploadError2) {
          console.error('Upload error:', uploadError2)
          return
        }

        console.log('✅ Image uploaded successfully!')
        console.log('File path:', uploadData.path)
      } else {
        console.error('Upload error:', uploadError)
        return
      }
    } else {
      console.log('✅ Image uploaded successfully!')
      console.log('File path:', data.path)
    }

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

setupAndUpload()
