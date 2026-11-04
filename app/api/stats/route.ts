import { NextResponse } from "next/server"
import { POKAZ_NIEOPUBLIKOWANE } from "@/lib/publikacja"
import { pobierzWszystkieFirmyRest } from "@/lib/companies-paged"

// Next 15: trasy GET nie są już domyślnie statyczne (w Next 14 były).
// Jawne revalidate przywraca cache trasy z okresem fetcha poniżej (5 minut).
export const revalidate = 300

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Kategoria w odpowiedzi — kształt niezmieniony (czyta go components/global-stats.tsx). */
interface KategoriaStat {
    name: string
    slug: string
    total: number
    polish: number
    polishPercentage: number
}

interface OdpowiedzStat {
    total: number
    polishCount: number
    foreignCount: number
    polishPercentage: number
    countryCount: number
    mostPolishCategory: KategoriaStat | null
    leastPolishCategory: KategoriaStat | null
    categories: KategoriaStat[]
}

export async function GET() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
    }

    try {
        // 1) Agregat po stronie Postgresa — jedno zapytanie, jeden wiersz w odpowiedzi.
        //    Tak liczymy docelowo: COUNT w bazie nie podlega limitowi db-max-rows,
        //    a Vercel nie parsuje i nie sumuje 1555 wierszy JSON przy każdym odświeżeniu.
        const zRpc = await statystykiZRpc(headers)
        if (zRpc) return NextResponse.json(zRpc)

        // 2) Fallback na czas, aż właściciel wklei tools/sql/2026-11-04-statystyki-rpc.sql
        //    w Supabase. Liczy to samo w Node, ale czyta firmy STRONICOWANO — bez tego
        //    PostgREST oddaje maks. 1000 wierszy i statystyki wychodzą z 2/3 bazy.
        const zFallbacku = await statystykiZFallbacku()
        if (zFallbacku) return NextResponse.json(zFallbacku)

        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    } catch (err) {
        console.error("[stats] Exception:", err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

/** RPC `get_company_stats`. Zwraca null, gdy funkcji jeszcze nie ma w bazie. */
async function statystykiZRpc(headers: Record<string, string>): Promise<OdpowiedzStat | null> {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_company_stats`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ pokaz_nieopublikowane: POKAZ_NIEOPUBLIKOWANE }),
            next: { revalidate: 300 }, // jak dotychczas: 5 minut
        })

        if (!res.ok) {
            // 404 / PGRST202 = funkcji nie ma (SQL jeszcze nie wklejony) — to spodziewany
            // stan, nie awaria. Schodzimy na fallback bez hałasu w logach.
            if (res.status !== 404) {
                console.error("[stats] RPC get_company_stats:", res.status, await res.text())
            }
            return null
        }

        const dane = (await res.json()) as OdpowiedzStat | null
        if (!dane || typeof dane.total !== "number") return null
        return dane
    } catch (err) {
        console.error("[stats] RPC wyjątek:", err)
        return null
    }
}

/** To samo liczone w Node ze stronicowanego odczytu firm. */
async function statystykiZFallbacku(): Promise<OdpowiedzStat | null> {
    type Wiersz = { country_code: string | null; categories: { name: string; slug: string } | null }

    const { rows: companies, complete } = await pobierzWszystkieFirmyRest<Wiersz>(
        "country_code,categories(name,slug)",
        {
            supabaseUrl: SUPABASE_URL!,
            supabaseKey: SUPABASE_ANON_KEY!,
            etykieta: "stats",
            init: { next: { revalidate: 300 } }, // jak dotychczas: 5 minut
        },
    )

    // Niepełny odczyt = liczby policzone z urwanej próbki. Lepiej oddać błąd (sekcja
    // statystyk się wtedy nie wyrenderuje) niż opublikować zafałszowany procent.
    if (!complete) {
        console.error(`[stats] Odczyt niepełny (${companies.length} wierszy) — nie publikuję statystyk`)
        return null
    }
    if (companies.length === 0) return null

    const total = companies.length
    const polishCount = companies.filter((c) => c.country_code === "PL").length
    const foreignCount = total - polishCount
    const polishPercentage = total > 0 ? Math.round((polishCount / total) * 100) : 0

    // Statystyki per kategoria; firmy bez kategorii trafiają do kubełka „Inne".
    const categoryMap = new Map<string, { name: string; slug: string; total: number; polish: number }>()
    for (const company of companies) {
        const catName = company.categories?.name || "Inne"
        const catSlug = company.categories?.slug || "inne"

        if (!categoryMap.has(catSlug)) {
            categoryMap.set(catSlug, { name: catName, slug: catSlug, total: 0, polish: 0 })
        }
        const cat = categoryMap.get(catSlug)!
        cat.total++
        if (company.country_code === "PL") cat.polish++
    }

    const categories: KategoriaStat[] = Array.from(categoryMap.values())
        .filter((cat) => cat.total >= 3) // próg jak dotychczas: min. 3 firmy w kategorii
        .map((cat) => ({ ...cat, polishPercentage: Math.round((cat.polish / cat.total) * 100) }))
        // Ten sam tiebreaker co w RPC, żeby oba warianty dawały identyczną kolejność.
        .sort((a, b) =>
            b.polishPercentage - a.polishPercentage || b.total - a.total || a.name.localeCompare(b.name, "pl"),
        )

    const countries = new Set(companies.map((c) => c.country_code).filter(Boolean))

    return {
        total,
        polishCount,
        foreignCount,
        polishPercentage,
        countryCount: countries.size,
        mostPolishCategory: categories.length > 0 ? categories[0] : null,
        leastPolishCategory: categories.length > 0 ? categories[categories.length - 1] : null,
        categories,
    }
}
