// Podmapa: wpisy blogowe (/blog/[slug]) z content/blog/*.md.

import { SITEMAP_HEADERS, getBlogEntries, renderUrlset } from "@/lib/sitemap-data"

export const revalidate = 3600

export async function GET() {
  return new Response(renderUrlset(getBlogEntries()), { headers: SITEMAP_HEADERS })
}
