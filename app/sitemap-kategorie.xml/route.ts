// Podmapa: strony kategorii (/kategoria/[slug]).

import { SITEMAP_HEADERS, getCategoryEntries, renderUrlset } from "@/lib/sitemap-data"

export const revalidate = 86400

export async function GET() {
  return new Response(renderUrlset(await getCategoryEntries()), { headers: SITEMAP_HEADERS })
}
