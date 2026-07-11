import type { Metadata } from "next"
import { CompaniesList } from "./CompaniesList"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, displayNameFromSlug } from "@/lib/slug-utils"
import type { CompanyGridItem } from "@/components/CompanyGrid"

export const revalidate = 3600 // ISR: odśwież listę co godzinę

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
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, slug, country_code, siedziba_pl, vat_czynny, website_url")
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("[companies] Błąd pobierania firm:", error)
      return []
    }

    return data.map((c: any) => ({
      id: c.id,
      slug: c.slug ? slugify(c.slug) : c.id,
      brand: c.slug ? displayNameFromSlug(c.slug) : c.name,
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
