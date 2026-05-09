import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get("category")
    const excludeId = searchParams.get("exclude")
    const limit = searchParams.get("limit") || "6"

    if (!categorySlug) {
        return NextResponse.json([])
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        // First get category ID from slug
        const catUrl = `${SUPABASE_URL}/rest/v1/categories?select=id&slug=eq.${encodeURIComponent(categorySlug)}&limit=1`
        const catRes = await fetch(catUrl, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
        })

        if (!catRes.ok) return NextResponse.json([])
        const catData = await catRes.json()
        if (catData.length === 0) return NextResponse.json([])
        const categoryId = catData[0].id

        // Get Polish companies from the same category (country_code = PL), excluding the current one
        let companiesUrl = `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website_url,country_code&category_id=eq.${categoryId}&country_code=eq.PL&limit=${limit}&order=name`

        if (excludeId) {
            companiesUrl += `&id=neq.${excludeId}`
        }

        const res = await fetch(companiesUrl, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
            },
        })

        if (!res.ok) return NextResponse.json([])
        const data = await res.json()

        const results = data.map((company: any) => ({
            id: company.id,
            slug: company.slug,
            brand: company.slug
                ?.split("-")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ") || company.name,
            website_url: company.website_url,
            country_code: company.country_code,
        }))

        return NextResponse.json(results)
    } catch (err) {
        console.error("[v0] Exception in alternatives fetch:", err)
        return NextResponse.json([])
    }
}
