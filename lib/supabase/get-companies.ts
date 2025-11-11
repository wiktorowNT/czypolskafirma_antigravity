import { getSupabaseServerClient } from "./server"
import { getCachedCategoryData } from "./category-cache"

export async function getCompanySlugsFromSupabase(): Promise<Set<string>> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.from("companies").select("slug")

    if (error) {
      console.error("[v0] Error fetching company slugs from Supabase:", error)
      return new Set()
    }

    if (!data) {
      console.log("[v0] No companies found in Supabase")
      return new Set()
    }

    const slugs = new Set(data.map((company) => company.slug?.toLowerCase()).filter(Boolean))
    console.log(`[v0] Found ${slugs.size} companies in Supabase:`, Array.from(slugs))

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
