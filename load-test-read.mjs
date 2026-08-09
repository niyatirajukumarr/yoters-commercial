/**
 * Read-path load test.
 *
 * Simulates what 2400 customers actually do at lunch: open a restaurant page.
 * That is three reads, and they go straight from the browser to Supabase with
 * the anon key — the payment endpoints are not the bottleneck, and hitting
 * them would write real orders, so this test never writes anything.
 *
 * Each virtual user loops: resolve the slug (fetch cafeterias), load the menu,
 * then pause for a think time, the way a real person reads a menu before
 * tapping anything.
 *
 *   node load-test-read.mjs                 # 300 users, 20s — safe smoke test
 *   node load-test-read.mjs --full          # ramp 300 -> 600 -> 1200 -> 2400
 *   node load-test-read.mjs --users 800 --seconds 30
 *
 * Caveat worth remembering when you read the numbers: this drives everything
 * from one machine on one IP. Real customers arrive on thousands of IPs over
 * mobile networks. A wall here can be this laptop's sockets or Supabase's
 * per-IP protection rather than your database.
 */

import { readFileSync } from 'node:fs'
import { Agent, setGlobalDispatcher } from 'undici'

// Without this, Node pools a small number of sockets per origin and queues the
// rest. That queueing shows up as server latency and makes the p95 look like a
// database problem when it is really this process throttling itself.
setGlobalDispatcher(new Agent({ connections: 4096, pipelining: 0 }))

// --- config -----------------------------------------------------------------

// Real traffic is mixed: at 1pm some customers are on LETHAFI and some on
// Bombay Dine at the same moment. Virtual users are split evenly between them
// so both menus are being read concurrently, and results are reported per
// restaurant — their menus differ in size, so they do not cost the same.
const RESTAURANTS = [
  { name: 'Bombay Dine', id: '57c1ab71-b6ca-48a1-987a-c6b7ca7ebac0' },
  { name: 'LETHAFI', id: '3a35c6b8-ac96-4032-91f0-16e69b680a56' },
]
// How long a customer reads the menu before loading anything again. This is
// what separates "concurrent users" from "concurrent requests": 2400 people
// each loading a page once a minute is 40 page loads a second, not 2400.
const THINK_TIME_MS = 3000

function loadEnv() {
  const raw = readFileSync(new URL('.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : fallback
}

const THINK = flag('think', THINK_TIME_MS)

const STAGES = args.includes('--full')
  ? [
      { users: 300, seconds: 30 },
      { users: 600, seconds: 30 },
      { users: 1200, seconds: 45 },
      { users: 2400, seconds: 60 },
    ]
  : [{ users: flag('users', 300), seconds: flag('seconds', 20) }]

// --- the two reads a menu page makes ----------------------------------------

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }

// Mirrors app/mobile/order/[cafeteriaId]/page.tsx exactly. The slug lookup is
// deliberately included even though the page caches it in sessionStorage — a
// lunch rush is mostly first-time page loads, so most users do pay for it.
const requestsFor = id => [
  `${SUPABASE_URL}/rest/v1/cafeterias?select=id,name`,
  `${SUPABASE_URL}/rest/v1/cafeterias?select=*&id=eq.${id}`,
  `${SUPABASE_URL}/rest/v1/cafeteria_menu?select=*&cafeteria_id=eq.${id}&is_available=eq.true`,
]

// --- measurement ------------------------------------------------------------

function newStats() {
  return { latencies: [], ok: 0, failed: 0, rateLimited: 0, byStatus: {}, bytes: 0 }
}

async function timedFetch(url, stats) {
  const started = performance.now()
  try {
    const res = await fetch(url, { headers })
    const body = await res.arrayBuffer()
    const ms = performance.now() - started
    stats.latencies.push(ms)
    stats.byStatus[res.status] = (stats.byStatus[res.status] || 0) + 1
    stats.bytes += body.byteLength
    if (res.status === 429) stats.rateLimited++
    else if (res.ok) stats.ok++
    else stats.failed++
  } catch (err) {
    stats.latencies.push(performance.now() - started)
    stats.failed++
    const key = err.cause?.code || err.code || 'NETWORK'
    stats.byStatus[key] = (stats.byStatus[key] || 0) + 1
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function virtualUser(stats, until, restaurant, thinkMs) {
  const urls = requestsFor(restaurant.id)
  while (performance.now() < until) {
    // A page load fires its reads together, as the app does with Promise.all.
    await Promise.all(urls.map(u => timedFetch(u, stats)))
    if (performance.now() >= until) break
    await sleep(thinkMs)
  }
}

const pct = (sorted, p) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0

function report(label, stats, elapsed, indent = '   ') {
  const total = stats.ok + stats.failed + stats.rateLimited
  const sorted = [...stats.latencies].sort((a, b) => a - b)
  console.log(`${indent}${label}`)
  console.log(`${indent}  requests    ${total}  (${(total / elapsed).toFixed(1)}/s)`)
  console.log(`${indent}  ok ${stats.ok}   failed ${stats.failed}   429s ${stats.rateLimited}`)
  console.log(`${indent}  latency     p50 ${pct(sorted, 50).toFixed(0)}ms   p95 ${pct(sorted, 95).toFixed(0)}ms   p99 ${pct(sorted, 99).toFixed(0)}ms   max ${(sorted.at(-1) ?? 0).toFixed(0)}ms`)
  console.log(`${indent}  transferred ${(stats.bytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`${indent}  statuses    ${JSON.stringify(stats.byStatus)}`)
  return { total, p95: pct(sorted, 95), p99: pct(sorted, 99) }
}

async function runStage({ users, seconds }) {
  // One stats bucket per restaurant, plus a combined view.
  const perRestaurant = RESTAURANTS.map(r => ({ restaurant: r, stats: newStats() }))
  const started = performance.now()
  const until = started + seconds * 1000

  const split = RESTAURANTS.map((r, i) => {
    const n = Math.floor(users / RESTAURANTS.length) + (i < users % RESTAURANTS.length ? 1 : 0)
    return `${n} on ${r.name}`
  }).join(', ')
  process.stdout.write(`\n▶ ${users} concurrent users for ${seconds}s (${split}) ... `)

  const workers = []
  for (let i = 0; i < users; i++) {
    const slot = perRestaurant[i % RESTAURANTS.length]
    workers.push(virtualUser(slot.stats, until, slot.restaurant, THINK))
  }
  await Promise.all(workers)

  const elapsed = (performance.now() - started) / 1000
  console.log('done')

  const combined = newStats()
  for (const { stats } of perRestaurant) {
    combined.ok += stats.ok
    combined.failed += stats.failed
    combined.rateLimited += stats.rateLimited
    combined.bytes += stats.bytes
    combined.latencies.push(...stats.latencies)
    for (const [k, v] of Object.entries(stats.byStatus)) {
      combined.byStatus[k] = (combined.byStatus[k] || 0) + v
    }
  }

  for (const { restaurant, stats } of perRestaurant) report(restaurant.name, stats, elapsed)
  const all = report('COMBINED', combined, elapsed)

  return {
    users, elapsed, stats: combined, total: all.total, p95: all.p95, p99: all.p99,
    perRestaurant: perRestaurant.map(({ restaurant, stats }) => {
      const sorted = [...stats.latencies].sort((a, b) => a - b)
      return { name: restaurant.name, total: stats.ok + stats.failed + stats.rateLimited, p95: pct(sorted, 95), failed: stats.failed }
    }),
  }
}

// --- run --------------------------------------------------------------------

console.log('Read-path load test — no writes, no payments')
console.log(`target: ${SUPABASE_URL}`)

const results = []
for (const stage of STAGES) results.push(await runStage(stage))

console.log('\n' + '='.repeat(64))
console.log('SUMMARY')
console.log('='.repeat(64))
console.log('users    req/s     p95        p99        errors   429s   per-restaurant p95')
for (const r of results) {
  const errRate = r.total ? ((r.stats.failed / r.total) * 100).toFixed(2) : '0.00'
  const split = r.perRestaurant.map(p => `${p.name} ${p.p95.toFixed(0)}ms`).join('  ')
  console.log(
    `${String(r.users).padEnd(8)} ${(r.total / r.elapsed).toFixed(1).padEnd(9)} ` +
    `${(r.p95.toFixed(0) + 'ms').padEnd(10)} ${(r.p99.toFixed(0) + 'ms').padEnd(10)} ` +
    `${(errRate + '%').padEnd(8)} ${String(r.stats.rateLimited).padEnd(6)} ${split}`
  )
}

const worst = results.at(-1)
const errRate = worst.total ? (worst.stats.failed / worst.total) * 100 : 0
console.log('')
console.log(errRate < 1 ? '✅ error rate under 1%' : `❌ error rate ${errRate.toFixed(2)}%`)
console.log(worst.p95 < 1000 ? '✅ p95 under 1s' : `❌ p95 ${worst.p95.toFixed(0)}ms`)
