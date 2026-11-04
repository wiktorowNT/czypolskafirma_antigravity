import { getSupabaseServerClient } from "./server"
import { pobierzWszystkieFirmy } from "@/lib/companies-paged"

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

    // Grupowanie po kategoriach wymaga wszystkich firm — stronicowano, bo PostgREST
    // oddaje maks. 1000 wierszy (lib/companies-paged.ts).
    const { rows: data } = await pobierzWszystkieFirmy<CompanyData>(
      supabase,
      `
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
      `,
      {
        etykieta: "get-categories",
        dostrojZapytanie: (q) => q.order("categories(slug)").order("id", { ascending: true }),
      },
    )

    if (data.length === 0) {
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
