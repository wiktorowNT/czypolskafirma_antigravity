import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"

export const dynamic = "force-dynamic"

export async function GET() {
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
