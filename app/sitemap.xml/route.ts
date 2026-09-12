// Indeks map witryny. Wskazuje na cztery podmapy tematyczne, dzięki czemu
// Search Console raportuje indeksację osobno dla firm, kategorii, bloga i stron
// statycznych. Adres pozostaje ten sam (/sitemap.xml), więc zgłoszenie w GSC
// i wpis w robots.txt nie wymagają zmiany.

import {
  BASE_URL,
  SITEMAP_HEADERS,
  getBlogEntries,
  getCategoryEntries,
  getCompanyEntries,
  getStaticEntries,
  latestLastmod,
  renderSitemapIndex,
} from "@/lib/sitemap-data"

export const revalidate = 3600 // godzina — świeże dla nowych firm, bez obciążania Supabase

export async function GET() {
  const [companies, categories] = await Promise.all([getCompanyEntries(), getCategoryEntries()])

  const xml = renderSitemapIndex([
    { url: `${BASE_URL}/sitemap-strony.xml`, lastModified: latestLastmod(getStaticEntries()) },
    { url: `${BASE_URL}/sitemap-firmy.xml`, lastModified: latestLastmod(companies) },
    { url: `${BASE_URL}/sitemap-kategorie.xml`, lastModified: latestLastmod(categories) },
    { url: `${BASE_URL}/sitemap-blog.xml`, lastModified: latestLastmod(getBlogEntries()) },
  ])

  return new Response(xml, { headers: SITEMAP_HEADERS })
}
