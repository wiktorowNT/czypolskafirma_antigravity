import { getSupabaseServerClient } from "./server"

interface CompanyData {
  id: string
  name: string
  slug: string
  city?: string
  nip?: string
  score?: number
  categories?: {
    name: string
    slug: string
  }
}

export async function getCategoriesFromSupabase(): Promise<Record<string, { name: string; companies: CompanyData[] }>> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        slug,
        city,
        nip,
        score,
        categories (
          name,
          slug
        )
      `)
      .order("categories(slug)")

    if (error) {
      console.error("[v0] Error fetching categories from Supabase:", error)
      return {}
    }

    if (!data || data.length === 0) {
      console.log("[v0] No companies found in Supabase")
      return {}
    }

    const categoriesMap: Record<string, CompanyData[]> = {}
    data.forEach((company) => {
      const categorySlug = company.categories?.slug || "uncategorized"
      if (!categoriesMap[categorySlug]) {
        categoriesMap[categorySlug] = []
      }
      categoriesMap[categorySlug].push(company)
    })

    console.log("[v0] Categories from Supabase:", Object.keys(categoriesMap))

    const result: Record<string, { name: string; companies: CompanyData[] }> = {}
    Object.entries(categoriesMap).forEach(([slug, companies]) => {
      result[slug] = {
        name: slug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        companies,
      }
    })

    return result
  } catch (err) {
    console.error("[v0] Exception in getCategoriesFromSupabase:", err)
    return {}
  }
}
