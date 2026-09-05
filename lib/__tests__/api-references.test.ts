import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

// Guard against a whole class of app-only bug.
//
// The app bundle contains no /api routes — they stay on Vercel — so any
// reference to a bare "/api/..." path resolves against the device
// (https://localhost) and fails. On the web build the same string works fine,
// so the mistake is invisible until someone opens the packaged app.
//
// This bit once already: the team photos were <img src="/api/team-photo/…">.
// The sweep that moved every call onto apiFetch only rewrote fetch(), and an
// image src is not a fetch, so four photos silently 404'd on the phone.
//
// Every "/api/..." literal outside the route handlers themselves must therefore
// go through apiFetch (which prefixes the origin) or apiUrl (for anything that
// is not a fetch: an <img src>, a link, a download).

const FILES = execFileSync('git', ['ls-files', 'app', 'components', 'lib'], { encoding: 'utf8' })
  .split('\n')
  .filter(f => /\.(ts|tsx)$/.test(f))
  .filter(f => !f.startsWith('app/api/'))       // the routes themselves
  .filter(f => f !== 'lib/api.ts')              // where the prefixing lives
  .filter(f => !f.includes('__tests__'))

const API_LITERAL = /['"`]\/api\/[^'"`]*['"`]/g

describe('references to /api outside the route handlers', () => {
  it('always go through apiFetch or apiUrl', () => {
    const offenders: string[] = []

    for (const file of FILES) {
      const src = readFileSync(file, 'utf8')
      const lines = src.split('\n')
      lines.forEach((line, i) => {
        API_LITERAL.lastIndex = 0
        if (!API_LITERAL.test(line)) return
        // Accept the two sanctioned forms, plus a variable later handed to
        // apiFetch (the vendor dashboard builds its URL across lines).
        const ok =
          /apiFetch\(/.test(line) ||
          /apiUrl\(/.test(line) ||
          /^\s*(const|let)\s+\w*[Uu]rl\s*=/.test(line) ||
          /^\s*[?:]\s*[`'"]\/api\//.test(line)
        if (!ok) offenders.push(`${file}:${i + 1}  ${line.trim().slice(0, 90)}`)
      })
    }

    expect(offenders, `\nThese resolve against the device in the app build and will 404.\n` +
      `Wrap the path in apiUrl(), or call it through apiFetch():\n\n` +
      offenders.join('\n') + '\n').toEqual([])
  })

  it('covers a meaningful number of files', () => {
    // A guard that silently stops scanning is worse than none.
    expect(FILES.length).toBeGreaterThan(30)
  })
})
