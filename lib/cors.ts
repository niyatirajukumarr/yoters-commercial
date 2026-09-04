// Which origins may call this project's /api routes.
//
// This exists because of the mobile app. A Capacitor build serves its UI from
// the device — origin `https://localhost` on Android, `capacitor://localhost`
// on iOS — while the API stays on the deployed site. Every app request to /api
// is therefore cross-origin, and because apiFetch sends an Authorization
// header, every one of them is preflighted. So the API must name these origins
// explicitly or the browser blocks the response and the app shows empty screens
// with no visible error.
//
// A single Access-Control-Allow-Origin header cannot list several origins, so
// the value has to be chosen per request: echo the caller's Origin when it is
// on the allowlist, and send nothing when it is not. That is why this cannot
// live in next.config.ts's static headers().
//
// Note there is deliberately no Access-Control-Allow-Credentials. Identity here
// travels in a bearer token, never a cookie, so no route needs ambient
// credentials — and withholding it means a hostile page cannot ride along on a
// logged-in browser session even if an origin were ever mis-allowlisted.

function normalise(origin: string): string {
  return origin.trim().replace(/\/$/, '').toLowerCase()
}

export function allowedOrigins(): string[] {
  const origins = new Set<string>()

  // The Capacitor webview origins. Fixed by the platform, not by us.
  origins.add('https://localhost')
  origins.add('capacitor://localhost')

  // The deployed site itself.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      origins.add(normalise(new URL(appUrl).origin))
    } catch {
      // Malformed env value: fall through rather than crash the request.
    }
  }

  // Extra origins (a second custom domain, a preview host) as a comma list.
  for (const extra of (process.env.API_ALLOWED_ORIGINS || '').split(',')) {
    if (extra.trim()) origins.add(normalise(extra))
  }

  // Local development against a dev server.
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000')
  }

  return [...origins]
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  return allowedOrigins().includes(normalise(origin))
}

// Headers to attach to an /api response for a given caller. Returns an empty
// object for an origin that is not allowed, which leaves the browser to block
// it — the correct outcome, and quieter than inventing an error.
export function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) return {}
  return {
    'Access-Control-Allow-Origin': normalise(origin as string),
    // The allowed origin varies per caller, so caches must key on Origin.
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}
