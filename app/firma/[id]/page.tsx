import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { calculateIndexBreakdown, type CompanyBreakdown } from "@/lib/company-utils"
import CompanyProfileClient from "./CompanyProfileClient"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface CompanyDetail {
  id: string
  brand: string
  company: string
  slug: string
  categorySlug: string
  score: number
  badges: string[]
  website?: string
  logoUrl?: string
  headquarters?: { country: string; city: string }
  registry?: { krs?: string; nip?: string; regon?: string }
  tax?: { paysCITinPL?: boolean; lastYear?: string }
  production?: { inPL?: "tak" | "częściowo" | "nie"; notes?: string }
  employment?: { inPL?: "tak" | "częściowo" | "brak danych"; headcountPL?: number }
  rnd?: { inPL?: boolean; notes?: string }
  brandOrigin?: { fromPL?: boolean; notes?: string }
  ownership?: {
    companyTree?: Array<{ label: string; value: string }>
    beneficialOwners?: Array<{ name: string; country?: string; share?: string }>
  }
  breakdown?: CompanyBreakdown
  history?: Array<{ date: string; title: string; text?: string }>
  sources?: Array<{ label: string; url: string }>
  lastVerified?: string
  age?: number
}

interface SupabaseCompany {
  id: string
  name: string
  category_slug: string
  nip: string
  krs: string
  siedziba_pl: boolean
  vat_czynny: boolean
  rachunek_pl: boolean
  founded_at: string
  slug: string
  categories?: {
    name: string
    slug: string
  }
}

function calculateAge(foundedAt: string | null): number {
  if (!foundedAt) return 0
  const founded = new Date(foundedAt)
  const now = new Date()
  const years = now.getFullYear() - founded.getFullYear()
  const monthDiff = now.getMonth() - founded.getMonth()
  const dayDiff = now.getDate() - founded.getDate()

  // Subtract 1 if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return Math.max(0, years - 1)
  }
  return Math.max(0, years)
}

function calculatePolishIndex(siedzibaPl: boolean, vatCzynny: boolean, rachunekPl: boolean, age: number): number {
  let score = 0
  if (siedzibaPl) score += 40
  if (vatCzynny) score += 25
  if (rachunekPl) score += 10
  score += Math.min(25, age)
  return score
}

async function getCompanyData(slug: string): Promise<CompanyDetail | null> {
  try {
    console.log("[v0] Fetching company with slug:", slug, "at", new Date().toISOString())
    console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        slug,
        nip,
        krs,
        siedziba_pl,
        vat_czynny,
        rachunek_pl,
        founded_at,
        categories (
          name,
          slug
        )
      `)
      .eq("id", slug)
      .maybeSingle()

    console.log("[v0] Supabase response - data:", data)
    console.log("[v0] Supabase response - error:", error)

    if (error) {
      console.error("[v0] Supabase error:", error)
      return null
    }

    if (!data) {
      console.log("[v0] No company found for slug:", slug)
      return null
    }

    const company = data as SupabaseCompany

    const age = calculateAge(company.founded_at)
    const score = calculatePolishIndex(company.siedziba_pl, company.vat_czynny, company.rachunek_pl, age)

    const badges: string[] = []
    if (company.siedziba_pl) badges.push("SIEDZIBA_PL")
    if (company.vat_czynny) badges.push("CIT_PL")
    if (company.rachunek_pl) badges.push("KAPITAŁ_PL")

    const breakdown = calculateIndexBreakdown(score, badges)

    return {
      id: company.slug,
      brand: company.slug,
      company: company.name,
      slug: company.slug,
      categorySlug: company.categories?.slug || "inne",
      score,
      badges,
      age,
      registry: {
        krs: company.krs || undefined,
        nip: company.nip || undefined,
      },
      headquarters: company.siedziba_pl
        ? { country: "Polska", city: "Polska" }
        : { country: "Zagranica", city: "Zagranica" },
      tax: {
        paysCITinPL: company.vat_czynny,
      },
      breakdown,
      history: [
        {
          date: company.founded_at || "Brak danych",
          title: age > 0 ? `Założona ${age} ${age === 1 ? "rok" : age < 5 ? "lata" : "lat"} temu` : "Data założenia",
        },
      ],
      sources: [{ label: "Dane z bazy Supabase", url: "#" }],
      lastVerified: new Date().toISOString().split("T")[0],
    }
  } catch (err) {
    console.error("[v0] Error in getCompanyData:", err)
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params
  const company = await getCompanyData(id)

  if (!company) {
    return {
      title: "Firma nie znaleziona | CzyPolskaFirma",
      description: "Nie znaleziono profilu firmy w bazie danych CzyPolskaFirma.",
    }
  }

  return {
    title: `${company.brand} — Indeks polskości | CzyPolskaFirma`,
    description: `Sprawdź indeks polskości firmy ${company.brand} (${company.company}). Wynik: ${company.score}/100 punktów.`,
    openGraph: {
      title: `${company.brand} — Indeks polskości ${company.score}/100`,
      description: `Szczegółowy profil firmy ${company.brand} w serwisie CzyPolskaFirma`,
      type: "website",
    },
  }
}

export default async function CompanyProfilePage({ params }: { params: { id: string } }) {
  const { id } = params
  const company = await getCompanyData(id)

  if (!company) {
    notFound()
  }

  return <CompanyProfileClient params={{ id }} company={company} />
}
