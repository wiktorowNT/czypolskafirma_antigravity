// app/api/categories/route.ts
//
// SWIADOMIE BEZ checkRateLimit. To statycznie eksportowany route handler
// (GET bez argumentu `request`): Next piecze odpowiedz w czasie builda
// i serwuje ja z CDN, z ISR co 60 s. Zadne zapytanie nie dociera tu do
// Supabase, wiec nie ma czego limitowac, a samo siegniecie po IP
// (`request.headers`) wypchnelo by route'a w tryb dynamiczny i dodalo
// wywolanie funkcji do KAZDEGO wejscia na strone (naglowek, hero,
// wyszukiwarka i strony kategorii pytaja o kategorie). Byloby to odwrocenie
// oszczednosci CPU z commita 831eb08f.
import { NextResponse } from "next/server"

// Next 15: trasy GET nie są już domyślnie statyczne (w Next 14 były).
// Bez tego /api/categories renderowałoby się przy każdym żądaniu — jawne
// revalidate przywraca cache trasy z tym samym okresem co fetch poniżej.
export const revalidate = 60

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
