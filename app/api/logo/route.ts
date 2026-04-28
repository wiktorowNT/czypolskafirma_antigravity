import { NextResponse } from 'next/server'

/**
 * Logo proxy API route (legacy/backup).
 * 
 * Komponent CompanyLogo teraz używa lokalnych plików z /public/logos/
 * zamiast tego proxy. Ten endpoint jest zachowany jako backup API.
 * 
 * Usage: GET /api/logo?domain=example.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    return new NextResponse('Missing domain', { status: 400 })
  }

  const normalizedDomain = domain.toLowerCase().trim()

  try {
    const googleRes = await fetch(
      `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${normalizedDomain}&size=128`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    )

    if (googleRes.status === 404) {
      return new NextResponse('Not found', { status: 404 })
    }

    const arrayBuffer = await googleRes.arrayBuffer()

    // Reject Google's default globe icon (typically 726 bytes)
    // and extremely low-res/tiny icons (< 500 bytes).
    if (arrayBuffer.byteLength < 500) {
      return new NextResponse('Low quality or default icon rejected', { status: 404 })
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': googleRes.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error(`[API Logo] Error fetching for ${domain}:`, error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
