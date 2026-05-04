import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

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
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        // Prepare query by replacing spaces with wildcards to handle hyphens/spaces consistently
        const formattedQuery = query.trim().replace(/\s+/g, "*")

        // Search for companies by name or slug using ilike
        const url = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url,country_code,categories(name,slug)&or=(name.ilike.*${encodeURIComponent(formattedQuery)}*,slug.ilike.*${encodeURIComponent(formattedQuery)}*)&limit=50`

        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
        })

        if (!res.ok) {
            const text = await res.text()
            console.error("[v0] Supabase search failed:", text)
            return NextResponse.json([])
        }

        const data = await res.json()

        // Map to search result format
        const results = data.map((company: any) => ({
            id: company.id, // This is the UUID
            brand: company.slug ? company.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : company.name,
            company: company.name,
            category: company.categories?.name || "Inne",
            categorySlug: company.categories?.slug || "inne",
            website_url: company.website_url,
            country_code: company.country_code,
        }))

        return NextResponse.json(results)
    } catch (err) {
        console.error("[v0] Exception in company search:", err)
        return NextResponse.json([])
    }
}
