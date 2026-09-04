import { describe, it, expect, vi, afterEach } from 'vitest'

const getSession = vi.fn()
vi.mock('../supabase', () => ({ supabase: { auth: { getSession: () => getSession() } } }))

async function loadApi(base?: string) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', base ?? '')
  return import('../api')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.restoreAllMocks()
  getSession.mockReset()
})

describe('apiUrl', () => {
  it('leaves paths relative on the web target, where app and API share an origin', async () => {
    const { apiUrl } = await loadApi()
    expect(apiUrl('/api/vendor/orders')).toBe('/api/vendor/orders')
  })

  it('absolutises against the API origin for the app build', async () => {
    const { apiUrl } = await loadApi('https://yoters.app')
    // Without this the request would resolve against https://localhost — the
    // device itself — and never reach the server.
    expect(apiUrl('/api/vendor/orders')).toBe('https://yoters.app/api/vendor/orders')
  })

  it('tolerates a trailing slash on the configured base', async () => {
    const { apiUrl } = await loadApi('https://yoters.app/')
    expect(apiUrl('/api/x')).toBe('https://yoters.app/api/x')
  })

  it('leaves an absolute url untouched', async () => {
    const { apiUrl } = await loadApi('https://yoters.app')
    expect(apiUrl('https://api.razorpay.com/v1/x')).toBe('https://api.razorpay.com/v1/x')
  })
})

describe('apiFetch', () => {
  it('attaches the current supabase access token to our own API', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok_abc' } } })
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await loadApi('https://yoters.app')
    await apiFetch('/api/vendor/orders')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://yoters.app/api/vendor/orders')
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer tok_abc')
  })

  it('never sends the session token to a third-party origin', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok_abc' } } })
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await loadApi('https://yoters.app')
    await apiFetch('https://evil.example.com/collect')

    expect((fetchMock.mock.calls[0][1].headers as Headers).has('Authorization')).toBe(false)
    expect(getSession).not.toHaveBeenCalled()
  })

  it('does not overwrite an Authorization header the caller already set', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok_abc' } } })
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await loadApi()
    await apiFetch('/api/x', { headers: { Authorization: 'Bearer explicit' } })

    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Authorization')).toBe('Bearer explicit')
  })

  it('still sends the request when nobody is signed in', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await loadApi()
    // Guest checkout and the Razorpay webhook path are deliberately
    // session-less; a missing token must not block the call.
    await apiFetch('/api/razorpay/create-order', { method: 'POST' })

    expect((fetchMock.mock.calls[0][1].headers as Headers).has('Authorization')).toBe(false)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
