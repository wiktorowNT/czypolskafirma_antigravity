// Wspólne źródło danych dla sitemap. Mapa jest rozbita na indeks (/sitemap.xml)
// i cztery podmapy tematyczne (/sitemap-strony.xml, /sitemap-firmy.xml,
// /sitemap-kategorie.xml, /sitemap-blog.xml).
//
// Po co podział: Search Console raportuje „wykryte / zindeksowane" per mapa, więc
// dopiero rozbicie pokazuje, KTÓRA sekcja nie wchodzi do indeksu. Przy jednej mapie
// na 778 URL-i widać tylko zbiorczy wynik i nie da się tego zdiagnozować.

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/slug-utils"
import { getAllPosts } from "@/lib/blog"

export const BASE_URL = "https://czypolskafirma.pl"

// Stabilna data `lastmod` dla stron statycznych i kategorii. NIE używać tu new Date():
// mapy regenerują się co godzinę (revalidate), więc new Date() sprawiałby, że każda
// strona co godzinę wygląda na "zmienioną przed chwilą" — Google traci zaufanie do lastmod
// i przestaje go używać do planowania re-crawlu. Bumpuj ręcznie przy istotnych zmianach treści.
export const STATIC_LASTMOD = new Date("2026-07-23T00:00:00Z")

export interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly"
  priority: number
}

export function getStaticEntries(): SitemapEntry[] {
  return [
    { url: BASE_URL, lastModified: STATIC_LASTMOD, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/companies`, lastModified: STATIC_LASTMOD, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/kategorie`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/o-projekcie`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/metodologia`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/polityka-prywatnosci`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/regulamin`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/ulubione`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.4 },
  ]
}

export function getBlogEntries(): SitemapEntry[] {
  return getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))
}

export async function getCompanyEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("companies")
      .select("id, slug, verified_at, created_at")
      .order("name", { ascending: true })

    if (error || !data) return []

    // Kanoniczne slugi (slugify) — bez spacji, nawiasów, wielkich liter i polskich znaków.
    return data.map((company) => {
      const canonicalSlug = (company.slug ? slugify(company.slug) : "") || company.id
      return {
        url: `${BASE_URL}/firma/${canonicalSlug}`,
        // Stabilny lastmod z realnej daty wpisu. Kolejność: verified_at -> created_at
        // -> stała. NIGDY new Date(): przy godzinnej regeneracji dawałoby to wszystkim
        // firmom datę "teraz" co godzinę i Google przestaje ufać lastmod.
        lastModified: company.verified_at
          ? new Date(company.verified_at)
          : company.created_at
            ? new Date(company.created_at)
            : STATIC_LASTMOD,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }
    })
  } catch (error) {
    console.error("[sitemap] Błąd pobierania firm z Supabase:", error)
    return []
  }
}

export async function getCategoryEntries(): Promise<SitemapEntry[]> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("categories")
      .select("slug")
      .order("name", { ascending: true })

    if (error || !data) return []

    return data.map((category) => ({
      url: `${BASE_URL}/kategoria/${encodeURIComponent(category.slug)}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error("[sitemap] Błąd pobierania kategorii z Supabase:", error)
    return []
  }
}

/** Encje XML — URL-e są już percent-encoded, ale mapa musi być poprawna także dla danych z bazy. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Najświeższy lastmod w zbiorze — używany jako lastmod podmapy w indeksie. */
export function latestLastmod(entries: SitemapEntry[]): Date {
  if (entries.length === 0) return STATIC_LASTMOD
  return entries.reduce((max, e) => (e.lastModified > max ? e.lastModified : max), entries[0].lastModified)
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${escapeXml(e.url)}</loc>\n` +
        `    <lastmod>${e.lastModified.toISOString()}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        `  </url>`,
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function renderSitemapIndex(maps: { url: string; lastModified: Date }[]): string {
  const items = maps
    .map(
      (m) =>
        `  <sitemap>\n` +
        `    <loc>${escapeXml(m.url)}</loc>\n` +
        `    <lastmod>${m.lastModified.toISOString()}</lastmod>\n` +
        `  </sitemap>`,
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`
}

/** Wspólne nagłówki odpowiedzi dla wszystkich map. */
export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
} as const
