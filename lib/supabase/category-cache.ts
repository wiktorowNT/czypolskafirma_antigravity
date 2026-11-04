import { cache } from "react"
import { getSupabaseServerClient } from "./server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"

// Bez pamięci podręcznej w module: strona /kategoria/[slug] jest ISR (raz na dobę), więc to
// Next trzyma wyrenderowany HTML. Stary cache w pamięci instancji (24 h) dokładał drugą dobę
// nieświeżości: odświeżenie ISR na „ciepłej" instancji dostawało dane sprzed doby.
// `cache` z Reacta łączy tylko dwa wywołania w jednym renderze (generateMetadata + strona).

function calculatePolishScore(company: any): number {
  let score = 0
  if (company.siedziba_pl) score += 40
  if (company.vat_czynny) score += 25

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

  // Tylko pola, które czyta widok kategorii (lista, porównywarka, filtry). Te dane idą do
  // przeglądarki w ładunku RSC przy każdej karcie, więc NIP, KRS, daty i surowe flagi
  // (z nich liczy się wyżej `score` i `badges`) tylko zwiększały HTML.
  return {
    id: company.id,
    brand: resolveDisplayName(company.display_name, company.slug, company.name),
    company: company.name,
    score: score,
    badges: badges,
    // Kanoniczny slug URL — używany w linkach i JSON-LD na stronach kategorii
    slug: company.slug ? slugify(company.slug) : company.slug,
    country_code: company.country_code,
    country_code_2: company.country_code_2,
    website_url: company.website_url,
  }
}

export const getCachedCategoryData = cache(async function getCachedCategoryData(categorySlug: string) {
  // Decode URL-encoded slugs (e.g. %C5%BCywno%C5%9B%C4%87 → żywność)
  categorySlug = decodeURIComponent(categorySlug)

  try {
    const supabase = await getSupabaseServerClient()

    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", categorySlug)
      .single()

    if (categoryError || !categoryData) {
      console.error(`[v0] Error fetching category by slug "${categorySlug}":`, categoryError)
      return { companies: [], categorySlug, categoryName: "", categoryShort: "" }
    }

    const categoryId = categoryData.id

    // Now fetch companies for this specific category
    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        slug,
        display_name,
        founded_at,
        siedziba_pl,
        vat_czynny,
        country_code,
        country_code_2,
        website_url
      `)
      .eq("category_id", categoryId)
      .order("name", { ascending: true })
      .limit(1000)

    if (error) {
      console.error(`[v0] Error fetching category data from Supabase:`, error)
      return { companies: [], categorySlug, categoryName: categoryData.name, categoryShort: "" }
    }

    const mappedCompanies = (data || []).map(mapCompanyToItem)

    const result = {
      companies: mappedCompanies,
      categorySlug,
      categoryName: categoryData.name,
      categoryShort: "",
    }

    return result
  } catch (err) {
    console.error(`[v0] Exception in getCachedCategoryData:`, err)
    return { companies: [], categorySlug, categoryName: "", categoryShort: "" }
  }
})

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
