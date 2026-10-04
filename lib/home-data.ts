import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"

/**
 * Dane strony głównej liczone po stronie serwera (ISR co godzinę, app/page.tsx).
 * Dzięki temu kafle kategorii, statystyki i karta „Przykładowy wynik” są w HTML
 * od razu, bez zapytań z przeglądarki.
 */

export interface HeroCategory {
  id: string
  name: string
  slug: string
  icon?: string | null
  /** Liczba firm w kategorii i liczba firm z polskim kapitałem. */
  total?: number
  polish?: number
}

export interface HeroPopularTag {
  id: string
  slug: string
  displayName: string
  website_url: string | null
  country_code: string | null
}

/** Firma do karty „Przykładowy wynik” i listy „Też zaskakują”. */
export interface SampleCompany extends HeroPopularTag {
  legalName: string
  ownerName: string | null
  parentCompanyName: string | null
  categoryName: string | null
  verifiedAt: string | null
}

export interface HomeStats {
  total: number
  polishCount: number
  countryCount: number
  /** Kraje pochodzenia kapitału, malejąco po liczbie firm. */
  countries: { code: string; count: number }[]
  /** Kategorie z co najmniej 3 firmami, malejąco po udziale polskiego kapitału. */
  categories: { name: string; slug: string; total: number; polish: number; polishPercentage: number }[]
}

export interface HomeData {
  categories: HeroCategory[]
  companyCount: number | null
  popularTags: HeroPopularTag[]
  recentCompanies: HeroPopularTag[]
  sample: SampleCompany | null
  surprises: SampleCompany[]
  stats: HomeStats | null
}

const toTag = (c: any): HeroPopularTag => ({
  id: c.id,
  slug: c.slug ? slugify(c.slug) : c.id,
  displayName: resolveDisplayName(c.display_name, c.slug, c.name),
  website_url: c.website_url || null,
  country_code: c.country_code || null,
})

export async function getHomeData(): Promise<HomeData> {
  const result: HomeData = {
    categories: [],
    companyCount: null,
    popularTags: [],
    recentCompanies: [],
    sample: null,
    surprises: [],
    stats: null,
  }

  try {
    const supabase = await getSupabaseServerClient()
    const since = new Date()
    since.setDate(since.getDate() - 30)

    // Wszystkie firmy (tylko kraj i kategoria) — paginacja po 1000, limit PostgREST.
    async function fetchAllForStats() {
      const rows: { country_code: string | null; category_id: string | null }[] = []
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error } = await supabase
          .from("companies")
          .select("country_code, category_id")
          .range(from, from + 999)
        if (error || !data) break
        rows.push(...(data as any[]))
        if (data.length < 1000) break
      }
      return rows
    }

    const [categoriesRes, countRes, popularRes, recentRes, statRows] = await Promise.all([
      supabase.from("categories").select("id, name, slug, icon").order("name", { ascending: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.rpc("get_popular_companies", { since_date: since.toISOString(), result_limit: 16 }),
      supabase
        .from("companies")
        .select("id, slug, name, display_name, website_url, country_code")
        .order("created_at", { ascending: false })
        .limit(4),
      fetchAllForStats(),
    ])

    if (!countRes.error && typeof countRes.count === "number") {
      result.companyCount = countRes.count
    }
    if (!recentRes.error && Array.isArray(recentRes.data)) {
      result.recentCompanies = recentRes.data.map(toTag)
    }

    const popular: any[] = !popularRes.error && Array.isArray(popularRes.data) ? popularRes.data : []
    result.popularTags = popular.slice(0, 6).map(toTag)

    // Statystyki: kategorie i kraje
    const perCategory = new Map<string, { total: number; polish: number }>()
    const perCountry = new Map<string, number>()
    let polishCount = 0
    for (const r of statRows) {
      const code = (r.country_code || "").toUpperCase()
      const isPl = code === "PL"
      if (isPl) polishCount++
      if (code) perCountry.set(code === "UK" ? "GB" : code, (perCountry.get(code === "UK" ? "GB" : code) || 0) + 1)
      if (r.category_id) {
        const c = perCategory.get(r.category_id) || { total: 0, polish: 0 }
        c.total++
        if (isPl) c.polish++
        perCategory.set(r.category_id, c)
      }
    }

    if (!categoriesRes.error && categoriesRes.data) {
      result.categories = categoriesRes.data.map((c: any) => ({
        ...c,
        total: perCategory.get(c.id)?.total ?? 0,
        polish: perCategory.get(c.id)?.polish ?? 0,
      }))
    }

    if (statRows.length > 0) {
      result.stats = {
        total: statRows.length,
        polishCount,
        countryCount: perCountry.size,
        countries: [...perCountry.entries()]
          .map(([code, count]) => ({ code, count }))
          .sort((a, b) => b.count - a.count),
        categories: result.categories
          .filter((c) => (c.total ?? 0) >= 3)
          .map((c) => ({
            name: c.name,
            slug: c.slug,
            total: c.total!,
            polish: c.polish!,
            polishPercentage: Math.round((c.polish! / c.total!) * 100),
          }))
          .sort((a, b) => b.polishPercentage - a.polishPercentage),
      }
    }

    // Karta „Przykładowy wynik”: najpopularniejsze firmy z właścicielem; najpierw
    // zagraniczne (to one najczęściej zaskakują), potem polskie.
    const ids = popular.map((c) => c.id).filter(Boolean)
    if (ids.length > 0) {
      const { data: details } = await supabase
        .from("companies")
        .select("id, slug, name, display_name, website_url, country_code, owner_name, parent_company_name, verified_at, categories(name)")
        .in("id", ids)
      const byId = new Map((details || []).map((d: any) => [d.id, d]))
      const enriched: SampleCompany[] = ids
        .map((id) => byId.get(id))
        .filter((d: any) => d && d.owner_name)
        .map((d: any) => ({
          ...toTag(d),
          legalName: d.name,
          ownerName: d.owner_name || null,
          parentCompanyName: d.parent_company_name || null,
          categoryName: d.categories?.name || null,
          verifiedAt: d.verified_at || null,
        }))
      const foreign = enriched.filter((c) => (c.country_code || "").toUpperCase() !== "PL")
      result.sample = foreign[0] || enriched[0] || null
      result.surprises = foreign.filter((c) => c.id !== result.sample?.id).slice(0, 3)
    }
  } catch (error) {
    console.error("[home] Błąd pobierania danych strony głównej:", error)
  }

  return result
}
