import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: Request) {
    // Rate limit: 30 searches per minute per IP
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(ip, "search", { maxRequests: 30, windowSeconds: 60 })
    if (!allowed) {
        return NextResponse.json([], { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    let query = searchParams.get("q")

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    // Jeśli ktoś wklei cały link (np. https://czypolskafirma.pl/firma/biedronka), wyciągnij sam slug
    if (query.includes('czypolskafirma.pl/firma/')) {
        query = query.split('/firma/').pop()?.split('?')[0] || query
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const { getCountryCode } = await import("@/lib/countries")
        const countryCode = getCountryCode(query)
        
        const headers = {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Accept: "application/json",
        }

        let data: any[]
        if (countryCode) {
            // If it's a country search, filter by country_code
            const url = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,display_name,website_url,country_code,categories(name,slug)&country_code=eq.${countryCode}&limit=50`
            const res = await fetch(url, { headers })
            if (!res.ok) return NextResponse.json([])
            data = await res.json()
        } else {
            // Standard search by name, slug, NIP, KRS or brand alias (marki firmy).
            const formattedQuery = query.trim().replace(/\s+/g, "*")
            const q = encodeURIComponent(formattedQuery)
            // Wariant z brand_aliases; jeśli kolumny jeszcze nie ma w bazie
            // (przed migracją tools/sql/2026-07-18-brand-aliases.sql),
            // PostgREST zwróci błąd i przechodzimy na wariant bez aliasów.
            const urlWithAliases = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,display_name,website_url,country_code,brand_aliases,categories(name,slug)&or=(name.ilike.*${q}*,slug.ilike.*${q}*,nip.ilike.*${q}*,krs.ilike.*${q}*,brand_aliases.ilike.*${q}*)&limit=50`
            const urlLegacy = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,display_name,website_url,country_code,categories(name,slug)&or=(name.ilike.*${q}*,slug.ilike.*${q}*,nip.ilike.*${q}*,krs.ilike.*${q}*)&limit=50`

            let res = await fetch(urlWithAliases, { headers })
            if (!res.ok) {
                res = await fetch(urlLegacy, { headers })
                if (!res.ok) return NextResponse.json([])
            }
            data = await res.json()
        }

        // Map to search result format
        const queryLower = query.trim().toLowerCase()
        const results = data.map((company: any) => {
            // Handle categories as either object or array (PostgREST can return either depending on relationship)
            const categoryData = Array.isArray(company.categories) ? company.categories[0] : company.categories

            // Marka, przez którą firma pasuje do zapytania (np. "Lech" -> Kompania
            // Piwowarska) — do podpowiedzi w dropdownie wyszukiwarki.
            const matchedBrand = company.brand_aliases
                ? String(company.brand_aliases)
                      .split(",")
                      .map((s: string) => s.trim())
                      .find((b: string) => b && b.toLowerCase().includes(queryLower))
                : undefined

            return {
                matchedBrand,
                id: company.id, // This is the UUID
                slug: company.slug ? slugify(company.slug) : company.slug, // kanoniczny slug URL
                brand: resolveDisplayName(company.display_name, company.slug, company.name),
                company: company.name,
                category: categoryData?.name || "Inne",
                categorySlug: categoryData?.slug || "inne",
                website_url: company.website_url,
                country_code: company.country_code,
            }
        })

        return NextResponse.json(results)
    } catch (err) {
        console.error("[v0] Exception in company search:", err)
        return NextResponse.json([])
    }
}
