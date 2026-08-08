import { NextResponse, type NextRequest } from 'next/server'

// Only /api/trends does real per-request work (it fetches + aggregates Smogon
// data for arbitrary name/tier/month combos). Every other route here is fully
// static (SSG or ISR with revalidate=86400), so CDN caching already makes repeat
// GETs free — rate-limiting them too was blocking Googlebot's crawl of the sitemap
// with 429s and tanking indexing (GSC: 467 "not indexed" vs 35 indexed).
export const config = {
  matcher: ['/api/trends'],
}

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20

// Best-effort only: this Map is per-instance and resets on cold start, so it
// won't catch a bot spread across many edge instances. It's a cheap backstop
// on top of static generation (which is what actually removes the CPU cost),
// not a hard guarantee.
const hits = new Map<string, { count: number; windowStart: number }>()

function pruneIfLarge() {
  if (hits.size < 5000) return
  const now = Date.now()
  hits.forEach((entry, key) => {
    if (now - entry.windowStart > WINDOW_MS) hits.delete(key)
  })
}

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    pruneIfLarge()
    return NextResponse.next()
  }

  entry.count += 1

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000)
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    })
  }

  return NextResponse.next()
}
