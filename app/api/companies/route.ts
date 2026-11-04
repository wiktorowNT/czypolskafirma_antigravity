import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { pobierzWszystkieFirmy } from "@/lib/companies-paged"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Pełna lista firm dla /companies — musi być stronicowana, bo PostgREST oddaje
    // maks. 1000 wierszy i lista ucinała się na 1000 z 1555 firm (lib/companies-paged.ts).
    const { rows: data, complete } = await pobierzWszystkieFirmy<any>(
      supabase,
      "id, name, slug, display_name, country_code, siedziba_pl, vat_czynny, website_url",
      {
        etykieta: "api/companies",
        // `id` jako tiebreaker — przy równych nazwach utrzymuje stabilny podział na strony.
        dostrojZapytanie: (q) => q.order("name", { ascending: true }).order("id", { ascending: true }),
      },
    )

    if (!complete) {
      return NextResponse.json({ error: "Nie udało się pobrać pełnej listy firm" }, { status: 500 })
    }

    // Kanoniczne slugi URL + nazwa marki do wyświetlania
    const results = data.map((c: any) => ({
      ...c,
      slug: c.slug ? slugify(c.slug) : c.slug,
      brand: resolveDisplayName(c.display_name, c.slug, c.name),
    }))

    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
