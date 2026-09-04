#!/usr/bin/env node
/**
 * Blocks credentials from reaching a commit.
 *
 * Runs over staged content by default (the pre-commit hook path) and over the
 * whole tracked tree with --all (the CI path). Reads staged blobs from the
 * index rather than the working tree, so a `git add` followed by an edit cannot
 * sneak a secret past it.
 *
 * Usage:
 *   node scripts/scan-secrets.mjs            # staged changes
 *   node scripts/scan-secrets.mjs --all      # every tracked file
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const ALL = process.argv.includes('--all')

// Each rule is a shape that is only ever a real credential, never a variable
// name or a placeholder. Anything looser produces noise, and a scanner people
// routinely bypass protects nothing.
const RULES = [
  // Matched by decoding the payload rather than by shape: the repo legitimately
  // contains Supabase *storage* signed URLs, which are also JWTs. Only a key
  // carrying role=service_role is a credential worth blocking a commit for —
  // the anon key is public by design (it ships in NEXT_PUBLIC_).
  { name: 'Supabase service-role key', test: isServiceRoleJwt },
  { name: 'Razorpay live key id', re: /\brzp_live_[A-Za-z0-9]{10,}\b/ },
  { name: 'Razorpay/generic secret assignment', re: /\b(?:RAZORPAY_KEY_SECRET|RAZORPAY_PAYOUT_KEY_ID|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_WEBHOOK_SECRET|TWILIO_AUTH_TOKEN|RESEND_API_KEY)\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/ },
  { name: 'Twilio account sid', re: /\bAC[0-9a-fA-F]{32}\b/ },
  { name: 'Resend api key', re: /\bre_[A-Za-z0-9_]{20,}\b/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Google api key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'Slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
]

// Binary and lockfile content produces false positives and is never authored by
// hand; an .env file is caught by the separate filename rule below.
const SKIP = /(^|\/)(package-lock\.json|node_modules\/|android\/|ios\/|out\/|\.next\/|\.app-build\/)|\.(png|jpe?g|gif|webp|ico|mp4|mp3|woff2?|ttf|otf|obj|mtl|pdf)$/i

// Filenames that must never be committed regardless of content.
const FORBIDDEN_FILES = /(^|\/)\.env(\.|$)(?!example)|(^|\/)\.env$|\.(keystore|jks|p12|mobileprovision)$|(^|\/)google-services\.json$|(^|\/)GoogleService-Info\.plist$/i

// A JWT is only flagged if its decoded payload claims service_role. A storage
// signed URL decodes to {url, iat, exp} and is not a credential.
const JWT_RE = /\beyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{20,})\.[A-Za-z0-9_-]{20,}\b/g

function isServiceRoleJwt(line) {
  JWT_RE.lastIndex = 0
  for (const m of line.matchAll(JWT_RE)) {
    try {
      const payload = Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
      if (/"role"\s*:\s*"service_role"/.test(payload)) return true
    } catch {
      // Undecodable payload: not something we can call a service-role key.
    }
  }
  return false
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

const files = ALL
  ? git(['ls-files', '-z']).split('\0').filter(Boolean)
  : git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']).split('\0').filter(Boolean)

const findings = []

for (const file of files) {
  if (FORBIDDEN_FILES.test(file)) {
    findings.push({ file, line: 0, rule: 'File must never be committed', text: file })
    continue
  }
  if (SKIP.test(file)) continue

  let content
  try {
    // Read the staged blob, not the working tree: they can differ.
    content = ALL ? readFileSync(file, 'utf8') : git(['show', `:${file}`])
  } catch {
    continue // deleted, or not in the index
  }
  if (content.includes('\0')) continue // binary

  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('scan-secrets-allow')) continue
    for (const rule of RULES) {
      const hit = rule.test ? rule.test(line) : rule.re.test(line)
      if (hit) {
        findings.push({ file, line: i + 1, rule: rule.name, text: line.trim().slice(0, 100) })
      }
    }
  }
}

if (findings.length === 0) {
  console.log(`✓ no secrets found (${files.length} file${files.length === 1 ? '' : 's'} scanned)`)
  process.exit(0)
}

console.error(`\n✖ ${findings.length} potential secret${findings.length === 1 ? '' : 's'} found:\n`)
for (const f of findings) {
  console.error(`  ${f.file}${f.line ? `:${f.line}` : ''}`)
  console.error(`    ${f.rule}`)
  console.error(`    ${f.text}\n`)
}
console.error('Move the value into an environment variable and reference it via process.env.')
console.error('If a match is genuinely not a secret, append a `scan-secrets-allow` comment to that line.')
console.error('\nIf a real secret was already pushed, rotating it is the fix — deleting the commit is not.\n')
process.exit(1)
