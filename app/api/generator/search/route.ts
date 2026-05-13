import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    let query = searchParams.get("q")

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    if (query.includes('czypolskafirma.pl/firma/')) {
        query = query.split('/firma/').pop()?.split('?')[0] || query
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const formattedQuery = query.trim().replace(/\s+/g, "*")
        const url = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url,country_code,categories(name,slug)&or=(name.ilike.*${encodeURIComponent(formattedQuery)}*,slug.ilike.*${encodeURIComponent(formattedQuery)}*,nip.ilike.*${encodeURIComponent(formattedQuery)}*,krs.ilike.*${encodeURIComponent(formattedQuery)}*)&limit=20`

        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
        })

        if (!res.ok) {
            return NextResponse.json([])
        }

        const data = await res.json()

        const results = data.map((company: any) => {
            const categoryData = Array.isArray(company.categories) ? company.categories[0] : company.categories
            return {
                id: company.id,
                slug: company.slug,
                brand: company.slug 
                    ? company.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
                    : company.name,
                company: company.name,
                category: categoryData?.name || "Inne",
                categorySlug: categoryData?.slug || "inne",
                website_url: company.website_url,
                country_code: company.country_code,
            }
        })

        return NextResponse.json(results)
    } catch (err) {
        return NextResponse.json([])
    }
}
