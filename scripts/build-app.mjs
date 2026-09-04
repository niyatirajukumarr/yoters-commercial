#!/usr/bin/env node
/**
 * Builds the static bundle that Capacitor ships inside the Android/iOS app.
 *
 * The web build and the app build come from the same source but cannot be the
 * same Next build:
 *
 *   - The app needs `output: 'export'` (plain HTML/JS/CSS on the device, no
 *     Node server). Export rejects route handlers, proxy.ts, and any dynamic
 *     segment without a build-time id list.
 *   - The web build needs all three of those.
 *
 * Rather than mutate the working tree and risk leaving it broken when a build
 * fails, this copies the sources into .app-build/, prunes what export cannot
 * handle there, builds, and lifts the result out to out/. The real tree is
 * never touched, so an interrupted run costs nothing.
 *
 * Usage:  node scripts/build-app.mjs
 * Env:    NEXT_PUBLIC_API_BASE_URL  required — origin serving /api (the Vercel
 *                                   deployment). A relative path would resolve
 *                                   against the device and 404.
 */

import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync, symlinkSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const WORK = join(ROOT, '.app-build')
const OUT = join(ROOT, 'out')

// Copied into the build sandbox. Everything else is derived, huge, or web-only.
const SOURCES = [
  'app', 'components', 'lib', 'public',
  'tsconfig.json', 'next-env.d.ts', 'components.json', 'package.json',
]

// Pruned inside the sandbox because `output: 'export'` cannot represent them.
const PRUNE = [
  // Route handlers need a server. They stay deployed on Vercel; the app reaches
  // them over NEXT_PUBLIC_API_BASE_URL.
  'app/api',
  // Dynamic segments with no build-time id list. lib/routes.ts points the app
  // at the query-string twins (/mobile/track?order=…) instead.
  'app/mobile/track/[orderId]',
  'app/mobile/order/[cafeteriaId]',
  'app/delivery/[orderId]',
  // Staff surfaces. The app that ships to a phone is the customer app; vendors
  // and managers keep using the web dashboard, and shipping their screens would
  // put staff-only code on every customer's device.
  'app/admin', 'app/manager', 'app/vendor', 'app/student',
]

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: 'inherit', ...opts })
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
if (!apiBase) {
  console.error(
    '\nNEXT_PUBLIC_API_BASE_URL is not set.\n\n' +
    'The app bundle runs from the device, so every /api call needs an absolute\n' +
    'origin. Set it to the deployed web app, e.g.\n\n' +
    '  NEXT_PUBLIC_API_BASE_URL=https://yoters.example.com node scripts/build-app.mjs\n'
  )
  process.exit(1)
}
if (!/^https:\/\//i.test(apiBase)) {
  console.error(`\nNEXT_PUBLIC_API_BASE_URL must be https (got: ${apiBase}).`)
  console.error('Android and iOS both block cleartext traffic from the app by default.\n')
  process.exit(1)
}

console.log('› preparing .app-build sandbox')
rmSync(WORK, { recursive: true, force: true })
mkdirSync(WORK, { recursive: true })

for (const src of SOURCES) {
  const from = join(ROOT, src)
  if (!existsSync(from)) continue
  cpSync(from, join(WORK, src), { recursive: true })
}

for (const p of PRUNE) {
  rmSync(join(WORK, p), { recursive: true, force: true })
}

// Reuse the installed dependency tree rather than a second npm install.
symlinkSync(join(ROOT, 'node_modules'), join(WORK, 'node_modules'), 'dir')

// A dedicated config: export mode, and no headers(). Next ignores headers()
// under `output: 'export'` (there is no server to send them), so the security
// headers the web build sets are expressed for the app in two other places —
// the CSP as a <meta http-equiv> in the exported HTML, and the transport rules
// natively (Android network-security-config, iOS ATS).
writeFileSync(join(WORK, 'next.config.ts'), `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // No optimizer runs on a device, so images must be emitted untouched.
  images: { unoptimized: true },
  // Capacitor serves index.html per directory from the local filesystem.
  trailingSlash: true,
  // Type errors still fail the app build; Next 16 no longer takes an \`eslint\`
  // key here (linting is a separate step — see \`npm run lint\`).
  typescript: { ignoreBuildErrors: false },
}

export default nextConfig
`)

console.log('› next build (static export)')
run('npx', ['next', 'build'], {
  cwd: WORK,
  env: {
    ...process.env,
    NEXT_PUBLIC_BUILD_TARGET: 'app',
    NEXT_TELEMETRY_DISABLED: '1',
  },
})

const exported = join(WORK, 'out')
if (!existsSync(exported)) {
  console.error('\nBuild finished but .app-build/out is missing — nothing to package.')
  process.exit(1)
}

rmSync(OUT, { recursive: true, force: true })
cpSync(exported, OUT, { recursive: true })

const pages = readFileSync(join(OUT, 'index.html'), 'utf8').length
console.log(`\n✓ app bundle written to out/ (index.html ${pages} bytes)`)
console.log('  next: npx cap sync')
