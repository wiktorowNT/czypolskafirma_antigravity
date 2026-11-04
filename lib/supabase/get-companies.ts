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
      return new Set()
    }

    const slugs = new Set(data.map((company) => company.slug?.toLowerCase()).filter(Boolean))

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
    return exists
  })
}

export async function getCategoryDataFromSupabase(categorySlug: string) {
  return await getCachedCategoryData(categorySlug)
}
