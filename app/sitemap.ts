import type { MetadataRoute } from "next"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/slug-utils"

const BASE_URL = "https://czypolskafirma.pl"

export const revalidate = 3600 // Cache sitemap for 1 hour — fresh enough for new companies, reduces Supabase load

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/companies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kategorie`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/o-projekcie`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/metodologia`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/polityka-prywatnosci`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/regulamin`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ulubione`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ]

  // Dynamic pages from Supabase
  let companyPages: MetadataRoute.Sitemap = []
  let categoryPages: MetadataRoute.Sitemap = []

  try {
    const supabase = await getSupabaseServerClient()

    // Fetch all company IDs and slugs for /firma/[slug] pages
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, slug, verified_at")
      .order("name", { ascending: true })

    if (!companiesError && companies) {
      // Kanoniczne slugi (slugify) — bez spacji, nawiasów, wielkich liter i polskich znaków.
      companyPages = companies.map((company) => {
        const canonicalSlug = (company.slug ? slugify(company.slug) : "") || company.id
        return {
          url: `${BASE_URL}/firma/${canonicalSlug}`,
          lastModified: company.verified_at
            ? new Date(company.verified_at)
            : new Date(),
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
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error("[sitemap] Error fetching data from Supabase:", error)
  }

  // Sort by priority for cleaner sitemap
  return [...staticPages, ...companyPages, ...categoryPages].sort((a, b) => (b.priority || 0) - (a.priority || 0))
}
