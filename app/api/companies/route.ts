import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Limit: 20 odczytow na minute na IP. Route zwraca CALA tabele firm
  // (force-dynamic, bez cache), wiec jest najdrozszy w serwisie.
  // UWAGA: `checkRateLimit` jest limiterem in-memory. Na Vercel kazda instancja
  // funkcji ma wlasna mape, wiec limit NIE jest wspoldzielony miedzy instancjami
  // i przy wiekszym ruchu da sie go obejsc. Docelowo wspolny magazyn
  // (Redis/Upstash), patrz `docs/BACKLOG_BEZPIECZENSTWO.md`.
  const ip = getClientIp(request)
  const { allowed } = checkRateLimit(ip, "companies-all", { maxRequests: 20, windowSeconds: 60 })
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, slug, display_name, country_code, siedziba_pl, vat_czynny, website_url")
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Kanoniczne slugi URL + nazwa marki do wyświetlania
    const results = (data || []).map((c: any) => ({
      ...c,
      slug: c.slug ? slugify(c.slug) : c.slug,
      brand: resolveDisplayName(c.display_name, c.slug, c.name),
    }))

    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
