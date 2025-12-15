import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        // Use count query with Supabase REST API
        const url = `${SUPABASE_URL}/rest/v1/companies?select=id`
        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: "application/json",
                Prefer: "count=exact",
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!res.ok) {
            const text = await res.text()
            console.error("[v0] Supabase count failed:", text)
            return NextResponse.json({ count: 0 }, { status: 200 })
        }

        // Get count from content-range header
        const contentRange = res.headers.get("content-range")
        let count = 0
        if (contentRange) {
            const match = contentRange.match(/\/(\d+)$/)
            if (match) {
                count = parseInt(match[1], 10)
            }
        }

        return NextResponse.json({ count })
    } catch (err) {
        console.error("[v0] Exception in company count:", err)
        return NextResponse.json({ count: 0 }, { status: 200 })
    }
}
