import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// GET — retrieve view counts for a list of company IDs
// Query params: ids=uuid1,uuid2,uuid3&days=30
export async function GET(request: Request) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const ids = searchParams.get("ids")
        const days = parseInt(searchParams.get("days") || "30", 10)

        if (!ids) {
            return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 })
        }

        const companyIds = ids.split(",").filter(Boolean)
        if (companyIds.length === 0) {
            return NextResponse.json({})
        }

        // Calculate the date threshold
        const since = new Date()
        since.setDate(since.getDate() - days)
        const sinceISO = since.toISOString()

        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/get_company_view_counts`,
            {
                method: "POST",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_ids: companyIds,
                    since_date: sinceISO,
                }),
            }
        )

        if (!res.ok) {
            const text = await res.text()
            console.error("[view-counts] Failed to get view counts:", text)
            return NextResponse.json({})
        }

        const data = await res.json()
        
        // Convert array to { companyId: viewCount } map for easy client-side lookup
        const countsMap: Record<string, number> = {}
        for (const row of data) {
            countsMap[row.company_id] = row.view_count
        }

        return NextResponse.json(countsMap)
    } catch (err) {
        console.error("[view-counts] Exception:", err)
        return NextResponse.json({})
    }
}
