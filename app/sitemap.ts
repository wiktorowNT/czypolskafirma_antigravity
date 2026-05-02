import type { MetadataRoute } from "next"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const BASE_URL = "https://czypolskafirma.pl"

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

    // Fetch all company IDs for /firma/[id] pages
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, verified_at")
      .order("name", { ascending: true })

    if (!companiesError && companies) {
      companyPages = companies.map((company) => ({
        url: `${BASE_URL}/firma/${company.id}`,
        lastModified: company.verified_at
          ? new Date(company.verified_at)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    }

    // Fetch all category slugs for /kategoria/[slug] pages
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("slug")
      .order("name", { ascending: true })

    if (!categoriesError && categories) {
      categoryPages = categories.map((category) => ({
        url: `${BASE_URL}/kategoria/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error("[sitemap] Error fetching data from Supabase:", error)
  }

  return [...staticPages, ...categoryPages, ...companyPages]
}
