// Podmapa: strony statyczne (główna, listy, o projekcie, metodologia, regulaminy).

import { SITEMAP_HEADERS, getStaticEntries, renderUrlset } from "@/lib/sitemap-data"

export const revalidate = 3600

export async function GET() {
  return new Response(renderUrlset(getStaticEntries()), { headers: SITEMAP_HEADERS })
}
