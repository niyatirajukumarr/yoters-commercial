// Check available storage buckets
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBuckets() {
  try {
    console.log('Checking available buckets...')
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error('Error:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('Available buckets:')
      data.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.id})`)
      })
    } else {
      console.log('No buckets found')
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

checkBuckets()
