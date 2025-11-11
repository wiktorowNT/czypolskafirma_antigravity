// app/api/categories/route.ts
import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
  }

  const url = `${SUPABASE_URL}/rest/v1/categories?select=id,name,slug,icon&order=name`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: "Supabase fetch failed", detail: text }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
