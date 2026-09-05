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
  // The marketing landing page. Someone who installed the app is already past
  // the pitch, so the app opens on the ordering home instead (see the redirect
  // index.html written after the build). Dropping the route also drops the
  // 3.5 MB hero video below, which nothing else references.
  'app/page.tsx',
]

// Assets only the pruned routes referenced. They are copied wholesale with
// public/, and each one is dead weight inside the APK: the hero video belongs
// to the landing page, the notification sound to the vendor dashboard, and
// friends-bg.jpg is referenced by nothing at all.
const PRUNE_ASSETS = [
  'public/hero-video.mp4',
  'public/sound beat.mp3',
  'public/friends-bg.jpg',
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

for (const p of [...PRUNE, ...PRUNE_ASSETS]) {
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

// Capacitor loads index.html from the bundle root, and with the landing page
// pruned there is no longer a page at '/'. This sends the webview straight to
// the ordering home.
//
// location.replace rather than a link or a history push, so the back button
// from the home screen exits the app instead of returning to a blank redirect.
// The <meta refresh> is a fallback for the case where script has not run yet;
// the noscript copy keeps it honest if scripting is off entirely.
const HOME = '/mobile/home/'

// Fail loudly if the destination is not in the bundle. Without this a renamed
// or pruned route would leave the app opening on a redirect to nothing — a
// blank screen on launch, with no error anywhere.
const homeFile = join(exported, HOME.replace(/^\/|\/$/g, ''), 'index.html')
if (!existsSync(homeFile)) {
  console.error(`\nThe app opens on ${HOME}, but ${homeFile} was not exported.`)
  console.error('Either that route moved, or PRUNE removed it. Fix one or the other —')
  console.error('shipping this would launch the app onto a blank page.')
  process.exit(1)
}

writeFileSync(join(exported, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="refresh" content="0; url=${HOME}">
<title>Yoters</title>
<style>html,body{margin:0;height:100%;background:#FFF5F7}</style>
<script>location.replace(${JSON.stringify(HOME)})</script>
</head>
<body><noscript><a href="${HOME}">Continue to Yoters</a></noscript></body>
</html>
`)

rmSync(OUT, { recursive: true, force: true })
cpSync(exported, OUT, { recursive: true })

const pages = readFileSync(join(OUT, 'index.html'), 'utf8').length
console.log(`\n✓ app bundle written to out/ (index.html ${pages} bytes)`)
console.log('  next: npx cap sync')
