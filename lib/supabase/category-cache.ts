import { getSupabaseServerClient } from "./server"

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 godzin

interface CacheEntry {
  data: any
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}

function calculatePolishScore(company: any): number {
  let score = 0
  if (company.siedziba_pl) score += 40
  if (company.vat_czynny) score += 25
  if (company.rachunek_pl) score += 10

  if (company.founded_at) {
    const founded = new Date(company.founded_at)
    const years = (new Date().getTime() - founded.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    score += Math.min(25, (years / 30) * 25)
  }

  return Math.round(score)
}

function mapCompanyToItem(company: any) {
  const score = calculatePolishScore(company)
  const badges = []

  if (company.siedziba_pl) badges.push("HQ_PL")
  if (company.vat_czynny) badges.push("CIT_PL")
  if (company.rachunek_pl && company.vat_czynny) badges.push("PL_CAPITAL_50")

  return {
    id: company.id,
    brand: company.slug?.charAt(0).toUpperCase() + company.slug?.slice(1),
    company: company.name,
    score: score,
    badges: badges,
    slug: company.slug,
    category_slug: company.categories?.slug,
    nip: company.nip,
    krs: company.krs,
    siedziba_pl: company.siedziba_pl,
    vat_czynny: company.vat_czynny,
    rachunek_pl: company.rachunek_pl,
    founded_at: company.founded_at,
  }
}

export async function getCachedCategoryData(categorySlug: string) {
  const now = Date.now()
  const cached = cache[categorySlug]

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`[v0] Returning cached data for category: ${categorySlug}`)
    return cached.data
  }

  try {
    const supabase = await getSupabaseServerClient()

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single()

    if (categoryError || !categoryData) {
      console.error(`[v0] Error fetching category by slug "${categorySlug}":`, categoryError)
      return { companies: [], categorySlug }
    }

    const categoryId = categoryData.id

    // Now fetch companies for this specific category
    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        slug,
        nip,
        krs,
        founded_at,
        siedziba_pl,
        vat_czynny,
        rachunek_pl,
        categories (
          name,
          slug
        )
      `)
      .eq("category_id", categoryId)
      .order("name", { ascending: true })

    if (error) {
      console.error(`[v0] Error fetching category data from Supabase:`, error)
      return { companies: [], categorySlug }
    }

    const mappedCompanies = (data || []).map(mapCompanyToItem)

    const result = { companies: mappedCompanies, categorySlug }

    cache[categorySlug] = {
      data: result,
      timestamp: now,
    }

    console.log(`[v0] Fetched and cached ${mappedCompanies.length} companies for category: ${categorySlug}`)
    return result
  } catch (err) {
    console.error(`[v0] Exception in getCachedCategoryData:`, err)
    return { companies: [], categorySlug }
  }
}

export async function getAllCategoriesFromSupabase() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, icon")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching categories from Supabase:", error)
      return {}
    }

    if (!data) return {}

    const categoriesMap: Record<string, { name: string; slug: string; icon: string | null }> = {}
    data.forEach((category: any) => {
      categoriesMap[category.slug] = {
        slug: category.slug,
        name: category.name,
        icon: category.icon,
      }
    })

    return categoriesMap
  } catch (err) {
    console.error("[v0] Exception in getAllCategoriesFromSupabase:", err)
    return {}
  }
}
