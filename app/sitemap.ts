import type { MetadataRoute } from "next"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/slug-utils"
import { getAllPosts } from "@/lib/blog"

const BASE_URL = "https://czypolskafirma.pl"

// Stabilna data `lastmod` dla stron statycznych i kategorii. NIE używać tu new Date():
// sitemapa regeneruje się co godzinę (revalidate), więc new Date() sprawiałby, że każda
// strona co godzinę wygląda na "zmienioną przed chwilą" — Google traci zaufanie do lastmod
// i przestaje go używać do planowania re-crawlu. Bumpuj ręcznie przy istotnych zmianach treści.
const STATIC_LASTMOD = new Date("2026-07-23T00:00:00Z")

export const revalidate = 3600 // Cache sitemap for 1 hour — fresh enough for new companies, reduces Supabase load

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/companies`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kategorie`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/o-projekcie`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/metodologia`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/polityka-prywatnosci`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/regulamin`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ulubione`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ]

  // Blog posts from content/blog/*.md
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  // Dynamic pages from Supabase
  let companyPages: MetadataRoute.Sitemap = []
  let categoryPages: MetadataRoute.Sitemap = []

  try {
    const supabase = await getSupabaseServerClient()

    // Fetch all company IDs and slugs for /firma/[slug] pages
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, slug, verified_at, created_at")
      .order("name", { ascending: true })

    if (!companiesError && companies) {
      // Kanoniczne slugi (slugify) — bez spacji, nawiasów, wielkich liter i polskich znaków.
      companyPages = companies.map((company) => {
        const canonicalSlug = (company.slug ? slugify(company.slug) : "") || company.id
        return {
          url: `${BASE_URL}/firma/${canonicalSlug}`,
          // Stabilny lastmod z realnej daty wpisu. Kolejność: verified_at -> created_at
          // -> stała. NIGDY new Date(): przy godzinnej regeneracji sitemapy dawałoby to
          // wszystkim firmom datę "teraz" co godzinę i Google przestaje ufać lastmod.
          lastModified: company.verified_at
            ? new Date(company.verified_at)
            : company.created_at
              ? new Date(company.created_at)
              : STATIC_LASTMOD,
          changeFrequency: "weekly" as const,
          priority: 0.9, // Higher priority for company profiles
        }
      })
    }

    // Fetch all category slugs for /kategoria/[slug] pages
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("slug")
      .order("name", { ascending: true })

    if (!categoriesError && categories) {
      categoryPages = categories.map((category) => ({
        url: `${BASE_URL}/kategoria/${encodeURIComponent(category.slug)}`,
        lastModified: STATIC_LASTMOD,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error("[sitemap] Error fetching data from Supabase:", error)
  }

  // Sort by priority for cleaner sitemap
  return [...staticPages, ...blogPages, ...companyPages, ...categoryPages].sort((a, b) => (b.priority || 0) - (a.priority || 0))
}
