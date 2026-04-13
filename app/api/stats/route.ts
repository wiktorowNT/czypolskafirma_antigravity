import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
        // Fetch all companies with their category info
        const companiesUrl = `${SUPABASE_URL}/rest/v1/companies?select=id,country_code,categories(name,slug)`
        const companiesRes = await fetch(companiesUrl, {
            headers,
            next: { revalidate: 300 }, // Cache for 5 minutes
        })

        if (!companiesRes.ok) {
            const text = await companiesRes.text()
            console.error("[stats] Supabase fetch failed:", text)
            return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
        }

        const companies = await companiesRes.json()

        // Calculate global stats
        const total = companies.length
        const polishCount = companies.filter((c: any) => c.country_code === "PL").length
        const foreignCount = total - polishCount
        const polishPercentage = total > 0 ? Math.round((polishCount / total) * 100) : 0

        // Calculate stats per category
        const categoryMap = new Map<string, { name: string; slug: string; total: number; polish: number }>()

        for (const company of companies) {
            const catName = company.categories?.name || "Inne"
            const catSlug = company.categories?.slug || "inne"
            const key = catSlug

            if (!categoryMap.has(key)) {
                categoryMap.set(key, { name: catName, slug: catSlug, total: 0, polish: 0 })
            }

            const cat = categoryMap.get(key)!
            cat.total++
            if (company.country_code === "PL") {
                cat.polish++
            }
        }

        // Convert to array and calculate percentages
        const categories = Array.from(categoryMap.values())
            .filter(cat => cat.total >= 3) // Only categories with at least 3 companies
            .map(cat => ({
                ...cat,
                polishPercentage: Math.round((cat.polish / cat.total) * 100),
            }))
            .sort((a, b) => b.polishPercentage - a.polishPercentage)

        // Find most and least Polish categories
        const mostPolish = categories.length > 0 ? categories[0] : null
        const leastPolish = categories.length > 0 ? categories[categories.length - 1] : null

        // Count unique countries
        const countries = new Set(companies.map((c: any) => c.country_code).filter(Boolean))

        return NextResponse.json({
            total,
            polishCount,
            foreignCount,
            polishPercentage,
            countryCount: countries.size,
            mostPolishCategory: mostPolish,
            leastPolishCategory: leastPolish,
            categories,
        })
    } catch (err) {
        console.error("[stats] Exception:", err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
