// Podmapa: profile firm (/firma/[slug]) — największa i najważniejsza sekcja serwisu.
// To na niej patrzymy w GSC, żeby zobaczyć realny postęp indeksacji.

import { SITEMAP_HEADERS, getCompanyEntries, renderUrlset } from "@/lib/sitemap-data"

export const revalidate = 3600

export async function GET() {
  return new Response(renderUrlset(await getCompanyEntries()), { headers: SITEMAP_HEADERS })
}
