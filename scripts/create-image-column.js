// Create image_url column in cafeterias table using admin API
const https = require('https')

const supabaseUrl = 'https://qbvwcpjjattwebdzexni.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// SQL to add column if it doesn't exist
const sql = `
ALTER TABLE cafeterias
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
`

async function createColumn() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'qbvwcpjjattwebdzexni.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error('Error response:', res.statusCode, data)
          // Try direct SQL approach
          execSql(sql, resolve, reject)
        } else {
          console.log('Column created successfully')
          resolve()
        }
      })
    })

    req.on('error', (e) => {
      console.error('Request error:', e)
      execSql(sql, resolve, reject)
    })

    req.write(JSON.stringify({ query: sql }))
    req.end()
  })
}

function execSql(sql, resolve, reject) {
  const { createClient } = require('@supabase/supabase-js')
  const sb = createClient('https://qbvwcpjjattwebdzexni.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Since we can't directly execute raw SQL with the JS client, we'll just try to update the image_url field
  // If the column exists, it will work. If not, we'll get an error but at least we tried.
  console.log('Attempting to add column via direct Supabase update...')

  sb.from('cafeterias')
    .update({ image_url: 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/cafeteria-images/public/lit-bites-prof-cafe.webp' })
    .eq('name', 'Lit Bites Prof\'s Cafe')
    .then(({ error }) => {
      if (error && error.code === 'PGRST204') {
        console.log('Column does not exist. Please add it manually in Supabase dashboard:')
        console.log('ALTER TABLE cafeterias ADD COLUMN image_url TEXT;')
        reject(error)
      } else if (error) {
        console.error('Error:', error)
        reject(error)
      } else {
        console.log('✅ Image URL updated successfully!')
        resolve()
      }
    })
}

createColumn()
  .then(() => console.log('Done!'))
  .catch((err) => console.error('Final error:', err.message))
