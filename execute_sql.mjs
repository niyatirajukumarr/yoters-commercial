import https from 'https';

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const sql = `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment','payment_pending','pending_approval','approved','preparing','ready','collected','cancelled','paid','pending'));`;

const body = JSON.stringify({ query: sql });

const options = {
  hostname: supabaseUrl.hostname,
  path: '/rest/v1/rpc/pg_execute_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Result:', result.message || result.error || 'Done');
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', console.error);
req.write(body);
req.end();
