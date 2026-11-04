// Dane listy /companies: wspólne dla strony 1 (/companies), kolejnych stron
// (/companies/strona/[numer]) i pełnej listy do filtrowania w przeglądarce (/companies/lista.json).
// Tylko serwer (Supabase). Rzeczy potrzebne też w przeglądarce są w ./wspolne.ts.
import { cache } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { pobierzWszystkieFirmy } from "@/lib/companies-paged"
import type { CompanyGridItem } from "@/components/CompanyGrid"
import { porownajMarki } from "./wspolne"

/** Firm na jednej stronie listy. ~200 KB HTML (~11 KB gzip) zamiast 3,5 MB całej bazy. */
export const FIRM_NA_STRONE = 100

export const BAZOWY_URL = "https://czypolskafirma.pl"

export interface ListaFirm {
  firmy: CompanyGridItem[]
  /** false = odczyt z bazy urwał się w połowie (lib/companies-paged.ts). */
  complete: boolean
}

/**
 * Cała baza firm posortowana po nazwie marki, czyli w kolejności, w jakiej lista ją pokazuje.
 * Sortujemy tutaj, a nie w SQL, bo nazwa marki (`resolveDisplayName`) nie jest kolumną.
 * Odczyt całej tabeli, więc przez stronicowany helper (limit 1000 wierszy Supabase).
 * `cache` łączy wywołania z generateMetadata i strony w jednym renderze.
 */
export const pobierzListeFirm = cache(async (): Promise<ListaFirm> => {
  try {
    const supabase = await getSupabaseServerClient()
    const { rows, complete } = await pobierzWszystkieFirmy<any>(
      supabase,
      "id, name, slug, display_name, country_code, siedziba_pl, vat_czynny, website_url",
      {
        etykieta: "companies-page",
        // `id` jako tiebreaker: przy równych nazwach utrzymuje stabilny podział na strony.
        dostrojZapytanie: (q) => q.order("name", { ascending: true }).order("id", { ascending: true }),
      },
    )

    // Niepełny odczyt: lepiej pokazać to, co jest, niż pustą stronę na dobę ISR.
    if (!complete) console.error(`[companies] Odczyt niepełny: ${rows.length} firm`)

    const firmy: CompanyGridItem[] = rows.map((c: any) => {
      const firma: CompanyGridItem = {
        id: c.id,
        slug: c.slug ? slugify(c.slug) : c.id,
        brand: resolveDisplayName(c.display_name, c.slug, c.name),
        country_code: c.country_code ?? undefined,
        website_url: c.website_url ?? undefined,
      }
      // Flagi tylko gdy prawdziwe: mniej bajtów w HTML i w lista.json przy ~1500 firmach.
      if (c.siedziba_pl === true || c.siedziba_pl === "Tak") firma.headquartersInPL = true
      if (c.vat_czynny === true || c.vat_czynny === "Tak") firma.vatActive = true
      return firma
    })

    firmy.sort((a, b) => porownajMarki(a.brand, b.brand) || a.id.localeCompare(b.id))
    return { firmy, complete }
  } catch (err) {
    console.error("[companies] Wyjątek przy pobieraniu firm:", err)
    return { firmy: [], complete: false }
  }
})

export function liczbaStron(liczbaFirm: number): number {
  return Math.max(1, Math.ceil(liczbaFirm / FIRM_NA_STRONE))
}
