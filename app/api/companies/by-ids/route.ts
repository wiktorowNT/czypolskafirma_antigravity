import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get("ids")

    if (!ids) {
        return NextResponse.json([])
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    const idList = ids.split(",").filter(Boolean)
    if (idList.length === 0) {
        return NextResponse.json([])
    }

    // Cap at 50 to prevent abuse
    const cappedIds = idList.slice(0, 50)

    try {
        // Use PostgREST 'in' filter
        const filter = `id=in.(${cappedIds.map(id => encodeURIComponent(id)).join(",")})`
        const url = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url,country_code,siedziba_pl,vat_czynny,categories(name,slug)&${filter}`

        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
        })

        if (!res.ok) {
            const text = await res.text()
            console.error("[by-ids] Supabase fetch failed:", text)
            return NextResponse.json([])
        }

        const data = await res.json()

        const results = data.map((company: any) => ({
            id: company.id,
            brand: company.slug
                ? company.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                : company.name,
            company: company.name,
            category: company.categories?.name || "Inne",
            categorySlug: company.categories?.slug || "inne",
            website_url: company.website_url,
            country_code: company.country_code,
            siedziba_pl: company.siedziba_pl,
            vat_czynny: company.vat_czynny,
        }))

        return NextResponse.json(results)
    } catch (err) {
        console.error("[by-ids] Exception:", err)
        return NextResponse.json([])
    }
}
