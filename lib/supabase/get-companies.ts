import { getSupabaseServerClient } from "./server"
import { getCachedCategoryData } from "./category-cache"
import { pobierzWszystkieFirmy } from "@/lib/companies-paged"

export async function getCompanySlugsFromSupabase(): Promise<Set<string>> {
  try {
    const supabase = await getSupabaseServerClient()

    // Zbiór slugów wszystkich firm — stronicowano, bo PostgREST oddaje maks. 1000
    // wierszy i zbiór gubił firmy poza pierwszym tysiącem (lib/companies-paged.ts).
    const { rows: data } = await pobierzWszystkieFirmy<{ slug: string | null }>(supabase, "slug", {
      etykieta: "get-companies",
      dostrojZapytanie: (q) => q.order("id", { ascending: true }),
    })

    if (data.length === 0) {
      console.log("[v0] No companies found in Supabase")
      return new Set()
    }

    const slugs = new Set(data.map((company) => company.slug?.toLowerCase()).filter(Boolean) as string[])
    // Sama liczba, bez listy: przy 1555 firmach wypisywanie całego zbioru zasypywało logi.
    console.log(`[v0] Found ${slugs.size} companies in Supabase`)

    return slugs
  } catch (err) {
    console.error("[v0] Exception in getCompanySlugsFromSupabase:", err)
    return new Set()
  }
}

export function filterCategoryBySupabaseCompanies<T extends { id: string }>(
  items: T[],
  supabaseSlugs: Set<string>,
): T[] {
  return items.filter((item) => {
    const itemSlug = item.id.toLowerCase()
    const exists = supabaseSlugs.has(itemSlug)
    if (!exists) {
      console.log(`[v0] Filtering out company: ${item.id} (not in Supabase)`)
    }
    return exists
  })
}

export async function getCategoryDataFromSupabase(categorySlug: string) {
  return await getCachedCategoryData(categorySlug)
}
