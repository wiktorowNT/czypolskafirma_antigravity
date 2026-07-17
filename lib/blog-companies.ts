// Pobieranie danych firm dla sekcji bloga (karty firm na liście wpisów
// i we wpisie). Slugi w bazie bywają "surowe" (spacje, nawiasy), więc
// dopasowujemy po kanonicznym slugify() — tak samo jak profil /firma/[slug].

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"

export interface BlogCompany {
  id: string
  slug: string
  brand: string
  website_url?: string
  country_code?: string
}

/**
 * Zwraca firmy o podanych kanonicznych slugach, w kolejności z listy wejściowej.
 * Brakujące slugi są pomijane; przy błędzie (np. brak env) zwraca pustą listę.
 */
export async function getCompaniesBySlugs(companySlugs: string[]): Promise<BlogCompany[]> {
  if (companySlugs.length === 0) return []
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("companies")
      .select("id, slug, name, display_name, website_url, country_code")

    if (error || !data) return []

    const wanted = new Map(companySlugs.map((s, index) => [s, index]))
    return data
      .filter((c: any) => c.slug && wanted.has(slugify(c.slug)))
      .map((c: any) => ({
        id: c.id,
        slug: slugify(c.slug) || c.id,
        brand: resolveDisplayName(c.display_name, c.slug, c.name),
        website_url: c.website_url || undefined,
        country_code: c.country_code || undefined,
      }))
      .sort((a, b) => (wanted.get(a.slug) ?? 0) - (wanted.get(b.slug) ?? 0))
  } catch (err) {
    console.error("[blog] Błąd pobierania firm:", err)
    return []
  }
}
