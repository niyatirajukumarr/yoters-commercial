import { describe, it, expect, vi, afterEach } from 'vitest'

async function loadCors(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return import('../cors')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('allowed origins', () => {
  it('allows both Capacitor device origins', async () => {
    const { isAllowedOrigin } = await loadCors({ NODE_ENV: 'production' })
    // Without these the mobile app's every API call is blocked by the browser,
    // and the symptom is empty screens rather than a visible error.
    expect(isAllowedOrigin('https://localhost')).toBe(true)
    expect(isAllowedOrigin('capacitor://localhost')).toBe(true)
  })

  it('allows the deployed site origin from NEXT_PUBLIC_APP_URL', async () => {
    const { isAllowedOrigin } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.yoters.site',
    })
    expect(isAllowedOrigin('https://www.yoters.site')).toBe(true)
  })

  it('derives the origin even when APP_URL carries a path or trailing slash', async () => {
    const { isAllowedOrigin } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.yoters.site/',
    })
    expect(isAllowedOrigin('https://www.yoters.site')).toBe(true)
  })

  it('does not treat one domain as another', async () => {
    const { isAllowedOrigin } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.yoters.site',
    })
    // A bare apex is a different origin from www — if Vercel redirects between
    // them, the app must be pointed at whichever one is primary.
    expect(isAllowedOrigin('https://yoters.site')).toBe(false)
  })

  it('rejects an unknown origin', async () => {
    const { isAllowedOrigin, corsHeaders } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.yoters.site',
    })
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false)
    // No headers at all, so the browser blocks the response.
    expect(corsHeaders('https://evil.example.com')).toEqual({})
  })

  it('rejects a lookalike that merely contains an allowed origin', async () => {
    const { isAllowedOrigin } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.yoters.site',
    })
    expect(isAllowedOrigin('https://www.yoters.site.evil.com')).toBe(false)
    expect(isAllowedOrigin('https://evil.com/https://www.yoters.site')).toBe(false)
    expect(isAllowedOrigin('http://www.yoters.site')).toBe(false) // scheme matters
  })

  it('rejects a missing Origin header rather than defaulting open', async () => {
    const { isAllowedOrigin, corsHeaders } = await loadCors({ NODE_ENV: 'production' })
    expect(isAllowedOrigin(null)).toBe(false)
    expect(corsHeaders(null)).toEqual({})
  })

  it('never allows a wildcard', async () => {
    const { allowedOrigins } = await loadCors({ NODE_ENV: 'production' })
    expect(allowedOrigins()).not.toContain('*')
  })

  it('never sends Allow-Credentials, since identity is a bearer token', async () => {
    const { corsHeaders } = await loadCors({ NODE_ENV: 'production' })
    const h = corsHeaders('https://localhost')
    expect(h['Access-Control-Allow-Credentials']).toBeUndefined()
    expect(h['Access-Control-Allow-Origin']).toBe('https://localhost')
    expect(h.Vary).toBe('Origin')
  })

  it('does not expose the dev origin in production', async () => {
    const { isAllowedOrigin } = await loadCors({ NODE_ENV: 'production' })
    expect(isAllowedOrigin('http://localhost:3000')).toBe(false)
  })

  it('accepts extra origins from API_ALLOWED_ORIGINS', async () => {
    const { isAllowedOrigin } = await loadCors({
      NODE_ENV: 'production',
      API_ALLOWED_ORIGINS: 'https://a.example.com, https://b.example.com/',
    })
    expect(isAllowedOrigin('https://a.example.com')).toBe(true)
    expect(isAllowedOrigin('https://b.example.com')).toBe(true)
    expect(isAllowedOrigin('https://c.example.com')).toBe(false)
  })

  it('survives a malformed NEXT_PUBLIC_APP_URL', async () => {
    const { isAllowedOrigin } = await loadCors({
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'not a url',
    })
    expect(isAllowedOrigin('https://localhost')).toBe(true)
    expect(isAllowedOrigin('not a url')).toBe(false)
  })
})
