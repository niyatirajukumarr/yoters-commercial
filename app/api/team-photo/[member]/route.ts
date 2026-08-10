import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Serves the landing-page team photos from a private Storage bucket.
 *
 * These used to be Supabase signed URLs pasted straight into the component.
 * Those tokens do not expire until 2126 and the component is in a public
 * repo, so anyone could fetch the objects — or hotlink them — forever, with
 * no visit to yoters.site involved. Routing through here means the repo holds
 * no token, the bucket host is never exposed to the browser, and this file is
 * the single place to add a session check or swap the images later.
 *
 * To be clear about what this does not do: the photos are rendered on a
 * public page, so a visitor can still save them. Nothing served to a browser
 * can prevent that.
 */

// Only these ids resolve, and each maps to a fixed path. The member id from
// the URL is never used to build a storage path, so there is nothing to
// traverse out of.
const BUCKET = 'Meet the team'
const PHOTOS: Record<string, string> = {
  gowtham: 'gowtham-v2.jpeg',
  niyati: 'niyati.jpeg',
  shreyas: 'shreyas-v2.jpeg',
  rahul: 'rahul.jpeg',
}

const CONTENT_TYPES: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ member: string }> }
) {
  const { member } = await params
  const path = PHOTOS[member]
  if (!path) {
    return NextResponse.json({ error: 'Unknown team member.' }, { status: 404 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    logger.error('Team photo: SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json({ error: 'Photo unavailable.' }, { status: 500 })
  }

  try {
    // Service role because the bucket is private — this key stays on the
    // server and never reaches the client bundle.
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase.storage.from(BUCKET).download(path)
    if (error || !data) {
      logger.error('Team photo download failed:', error)
      return NextResponse.json({ error: 'Photo unavailable.' }, { status: 502 })
    }

    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    const body = await data.arrayBuffer()

    // Cached at the edge for a year. Four photos that change maybe once a
    // year should not cost an origin request per visitor — at lunch that
    // would be thousands of function invocations for four static images.
    //
    // Deliberately not rate limited: a crowded campus puts hundreds of
    // customers behind one NAT address, so a per-IP limit here would blank
    // out the team photos for a whole building. The CDN is the protection.
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': data.type || CONTENT_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400',
      },
    })
  } catch (e) {
    logger.error('Team photo error:', e)
    return NextResponse.json({ error: 'Photo unavailable.' }, { status: 500 })
  }
}
