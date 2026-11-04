import type { Metadata } from "next"
import { CompaniesList } from "./CompaniesList"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { pobierzWszystkieFirmy } from "@/lib/companies-paged"
import type { CompanyGridItem } from "@/components/CompanyGrid"

export const revalidate = 86400 // ISR: odśwież listę raz na dobę (limit CPU Vercela)

export const metadata: Metadata = {
  // Sufiks "| CzyPolskaFirma.pl" dodaje title.template z layoutu — bez ręcznego dopisywania.
  title: "Wszystkie firmy — sprawdź pochodzenie kapitału",
  description: "Przeglądaj pełną bazę firm i marek dostępnych w serwisie CzyPolskaFirma. Sprawdź pochodzenie kapitału.",
  alternates: {
    canonical: "https://czypolskafirma.pl/companies",
  },
}

// Lista firm renderowana server-side — linki <a href="/firma/..."> są w wyjściowym HTML.
async function getCompanies(): Promise<CompanyGridItem[]> {
  try {
    const supabase = await getSupabaseServerClient()
    // Stronicowano: PostgREST oddaje maks. 1000 wierszy, więc HTML tej strony (to, co widzi
    // Google) miał 1000 z 1555 firm, a reszta pojawiała się dopiero po dociągnięciu w przeglądarce.
    const { rows: data, complete } = await pobierzWszystkieFirmy<any>(
      supabase,
      "id, name, slug, display_name, country_code, siedziba_pl, vat_czynny, website_url",
      {
        etykieta: "companies-page",
        // `id` jako tiebreaker: przy równych nazwach utrzymuje stabilny podział na strony.
        dostrojZapytanie: (q) => q.order("name", { ascending: true }).order("id", { ascending: true }),
      },
    )

    // Niepełny odczyt: lepiej pokazać to, co jest (CompaniesList i tak dociąga pełną listę
    // z /api/companies w przeglądarce), niż pustą stronę na dobę ISR.
    if (!complete) console.error(`[companies] Odczyt niepełny: ${data.length} firm`)

    return data.map((c: any) => ({
      id: c.id,
      slug: c.slug ? slugify(c.slug) : c.id,
      brand: resolveDisplayName(c.display_name, c.slug, c.name),
      company: c.name,
      country_code: c.country_code,
      vatActive: c.vat_czynny === true || c.vat_czynny === "Tak",
      website_url: c.website_url,
      headquartersInPL: c.siedziba_pl === true || c.siedziba_pl === "Tak",
    }))
  } catch (err) {
    console.error("[companies] Wyjątek przy pobieraniu firm:", err)
    return []
  }
}

export default async function CompaniesPage() {
  const companies = await getCompanies()
  return <CompaniesList initialCompanies={companies} />
}
