import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// POST — record a company page view
export async function POST(request: Request) {
    // Rate limit: 30 view recordings per minute per IP
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(ip, "views-post", { maxRequests: 30, windowSeconds: 60 })
    if (!allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { companyId } = body

        if (!companyId) {
            return NextResponse.json({ error: "Missing companyId" }, { status: 400 })
        }

        // Insert a view record
        const res = await fetch(`${SUPABASE_URL}/rest/v1/company_views`, {
            method: "POST",
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify({ company_id: companyId }),
        })

        if (!res.ok) {
            const text = await res.text()
            console.error("[views] Failed to record view:", text)
            return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("[views] Exception recording view:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}

// GET — retrieve top viewed companies
export async function GET(request: Request) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const top = parseInt(searchParams.get("top") || "6", 10)
        const days = parseInt(searchParams.get("days") || "30", 10)

        // Calculate the date threshold
        const since = new Date()
        since.setDate(since.getDate() - days)
        const sinceISO = since.toISOString()

        // Use Supabase RPC or a direct query via PostgREST
        // We'll use a PostgreSQL function for aggregation (created via SQL migration)
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/get_popular_companies`,
            {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    since_date: sinceISO,
                    result_limit: top,
                }),
            }
        )

        if (!res.ok) {
            const text = await res.text()
            console.error("[views] Failed to get popular companies:", text)
            return NextResponse.json([])
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (err) {
        console.error("[views] Exception getting popular companies:", err)
        return NextResponse.json([])
    }
}
