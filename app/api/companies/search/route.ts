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
        
        let url: string
        if (countryCode) {
            // If it's a country search, filter by country_code
            url = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,display_name,website_url,country_code,categories(name,slug)&country_code=eq.${countryCode}&limit=50`
        } else {
            // Standard search by name, slug, NIP or KRS
            const formattedQuery = query.trim().replace(/\s+/g, "*")
            url = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,display_name,website_url,country_code,categories(name,slug)&or=(name.ilike.*${encodeURIComponent(formattedQuery)}*,slug.ilike.*${encodeURIComponent(formattedQuery)}*,nip.ilike.*${encodeURIComponent(formattedQuery)}*,krs.ilike.*${encodeURIComponent(formattedQuery)}*)&limit=50`
        }

        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
        })

        if (!res.ok) {
            const text = await res.text()
            return NextResponse.json([])
        }

        const data = await res.json()

        // Map to search result format
        const results = data.map((company: any) => {
            // Handle categories as either object or array (PostgREST can return either depending on relationship)
            const categoryData = Array.isArray(company.categories) ? company.categories[0] : company.categories
            
            return {
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
