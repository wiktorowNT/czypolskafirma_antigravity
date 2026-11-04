import { NextResponse } from "next/server"
import { FILTR_PUBLIKACJI } from "@/lib/publikacja"
import { przygotujFiltrSzukania } from "@/lib/search-query"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: Request) {
    // Limit: 30 wyszukiwan na minute na IP (tak jak /api/companies/search).
    // UWAGA: `checkRateLimit` jest limiterem in-memory. Na Vercel kazda instancja
    // funkcji ma wlasna mape, wiec limit NIE jest wspoldzielony miedzy instancjami
    // i przy wiekszym ruchu da sie go obejsc. Docelowo wspolny magazyn
    // (Redis/Upstash), patrz `docs/BACKLOG_BEZPIECZENSTWO.md`.
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(ip, "generator-search", { maxRequests: 30, windowSeconds: 60 })
    if (!allowed) {
        return NextResponse.json([], { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    let query = searchParams.get("q")

    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    // Wyciągnięcie sluga z wklejonego linku musi być PRZED sanityzacją,
    // bo sanityzacja usuwa ukośniki i dwukropki.
    if (query.includes('czypolskafirma.pl/firma/')) {
        query = query.split('/firma/').pop()?.split('?')[0] || query
    }

    // Biała lista znaków: bez niej przecinek, kropka albo nawias w zapytaniu
    // rozwalał filtr PostgREST (patrz `lib/search-query.ts`).
    const filtr = przygotujFiltrSzukania(query)
    if (!filtr) {
        return NextResponse.json([])
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const q = filtr.zakodowane
        const url = `${SUPABASE_URL}/rest/v1/companies?${FILTR_PUBLIKACJI}select=id,name,slug,display_name,website_url,country_code,owner_name,ownership_description,founded_at,verified_at,categories(name,slug)&or=(name.ilike.*${q}*,slug.ilike.*${q}*,nip.ilike.*${q}*,krs.ilike.*${q}*)&limit=20`

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
                brand: company.display_name
                    || (company.slug
                        ? company.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                        : company.name),
                company: company.name,
                category: categoryData?.name || "Inne",
                categorySlug: categoryData?.slug || "inne",
                website_url: company.website_url,
                country_code: company.country_code,
                owner_name: company.owner_name,
                ownership_description: company.ownership_description,
                founded_at: company.founded_at,
                verified_at: company.verified_at,
            }
        })

        return NextResponse.json(results)
    } catch (err) {
        return NextResponse.json([])
    }
}
