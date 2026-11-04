import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { FILTR_PUBLIKACJI } from "@/lib/publikacja"
import {
    czyDuplikatOdslony,
    czyIdPotwierdzone,
    jestPoprawnyUuid,
    zapamietajId,
} from "@/lib/view-guard"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Sprawdza w bazie, czy firma o danym id istnieje (i jest widoczna w tym
 * środowisku). Wynik pozytywny zapamiętujemy na godzinę, żeby nie wysyłać
 * zapytania do Supabase przy każdej odsłonie.
 */
async function czyFirmaIstnieje(idFirmy: string): Promise<boolean> {
    if (czyIdPotwierdzone(idFirmy)) return true

    const url = `${SUPABASE_URL}/rest/v1/companies?${FILTR_PUBLIKACJI}select=id&id=eq.${idFirmy}&limit=1`
    const res = await fetch(url, {
        headers: {
            apikey: SUPABASE_ANON_KEY as string,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Accept: "application/json",
        },
    })

    if (!res.ok) {
        const text = await res.text()
        console.error("[views] Nie udalo sie zweryfikowac firmy:", text)
        return false
    }

    const data = await res.json()
    const istnieje = Array.isArray(data) && data.length === 1

    if (istnieje) zapamietajId(idFirmy)
    return istnieje
}

// POST — zapis odsłony profilu firmy
export async function POST(request: Request) {
    // Limit: 30 zapisów odsłon na minutę na IP.
    // UWAGA: limiter jest in-memory, na Vercel nie jest współdzielony między
    // instancjami funkcji (szczegóły w `lib/rate-limit.ts`).
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

        // Odrzucamy wszystko, co nie jest UUID, zanim ruszymy bazę.
        if (!jestPoprawnyUuid(companyId)) {
            return NextResponse.json({ error: "Invalid companyId" }, { status: 400 })
        }

        // Licznik popularności zasila ranking „najpopularniejsze", więc nie
        // zliczamy odsłon firm, których nie ma w bazie.
        if (!(await czyFirmaIstnieje(companyId))) {
            return NextResponse.json({ error: "Unknown company" }, { status: 404 })
        }

        // Jedna odsłona na dobę z tego samego IP na tę samą firmę.
        // Deduplikacja jest in-memory i per instancja, patrz `lib/view-guard.ts`.
        if (czyDuplikatOdslony(ip, companyId)) {
            return NextResponse.json({ success: true, deduplicated: true })
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
    // Limit: 60 odczytów na minutę na IP (limiter in-memory, patrz `lib/rate-limit.ts`).
    const ipOdczytu = getClientIp(request)
    const { allowed } = checkRateLimit(ipOdczytu, "views-get", { maxRequests: 60, windowSeconds: 60 })
    if (!allowed) {
        return NextResponse.json([], { status: 429 })
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(request.url)
        // Parametry z URL-a trafiają do ciała zapytania RPC, więc trzymamy je
        // w rozsądnych granicach (i odrzucamy NaN).
        const topRaw = parseInt(searchParams.get("top") || "6", 10)
        const daysRaw = parseInt(searchParams.get("days") || "30", 10)
        const top = Number.isFinite(topRaw) ? Math.min(Math.max(topRaw, 1), 50) : 6
        const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30

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
