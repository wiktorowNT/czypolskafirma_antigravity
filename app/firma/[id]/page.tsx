import type { Metadata } from "next"
import { notFound } from "next/navigation"
import CompanyProfileClient from "./CompanyProfileClient"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface CompanyDetail {
  id: string
  name: string
  slug: string
  categorySlug: string
  categoryName: string
  nip?: string
  krs?: string
  siedziba_pl: boolean
  vat_czynny: boolean

  founded_at?: string
  age: number
  adres?: string
  owner_name?: string
  parent_company_name?: string
  ownership_type?: string
  notes?: string
  description?: string
  logoUrl?: string
  country_code?: string
  website_url?: string
  registry_url?: string
  lastVerified: string
}

interface SupabaseCompany {
  id: string
  name: string
  slug: string
  nip: string | null
  krs: string | null
  siedziba_pl: boolean
  vat_czynny: boolean
  founded_at: string | null
  adres: string | null
  owner_name: string | null
  parent_company_name: string | null
  ownership_type: string | null
  notes: string | null
  description: string | null
  country_code: string | null
  website_url: string | null
  registry_url: string | null
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

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return Math.max(0, years - 1)
  }
  return Math.max(0, years)
}

async function getCompanyData(id: string): Promise<CompanyDetail | null> {
  try {
    console.log("[v0] Fetching company with id:", id, "at", new Date().toISOString())

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

        founded_at,
        adres,
        owner_name,
        parent_company_name,
        ownership_type,
        description,
        notes,
        country_code,
        website_url,
        registry_url,
        categories (
          name,
          slug
        )
      `)
      .eq("id", id)
      .maybeSingle()

    console.log("[v0] Supabase response - data:", data)
    console.log("[v0] Supabase response - error:", error)

    if (error) {
      console.error("[v0] Supabase error:", error)
      return null
    }

    if (!data) {
      console.log("[v0] No company found for id:", id)
      return null
    }

    const company = data as unknown as SupabaseCompany
    const age = calculateAge(company.founded_at)

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      categorySlug: company.categories?.slug || "inne",
      categoryName: company.categories?.name || "Inne",
      nip: company.nip || undefined,
      krs: company.krs || undefined,
      siedziba_pl: company.siedziba_pl,
      vat_czynny: company.vat_czynny,

      founded_at: company.founded_at || undefined,
      age,
      adres: company.adres || undefined,
      owner_name: company.owner_name || undefined,
      parent_company_name: company.parent_company_name || undefined,
      ownership_type: company.ownership_type || undefined,
      notes: company.notes || undefined,
      description: company.description || undefined,
      country_code: company.country_code || undefined,
      website_url: company.website_url || undefined,
      registry_url: company.registry_url || undefined,
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

  const isPolish = company.siedziba_pl
  const status = isPolish ? "Polska Firma" : "Firma Zagraniczna"

  return {
    title: `${company.name} — ${status} | CzyPolskaFirma`,
    description: `Sprawdź czy ${company.name} jest polską firmą. Status: ${status}. Weryfikacja kapitału, siedziby i podatków.`,
    openGraph: {
      title: `${company.name} — ${status}`,
      description: `Szczegółowy profil firmy ${company.name} w serwisie CzyPolskaFirma`,
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

  return <CompanyProfileClient company={company} />
}
