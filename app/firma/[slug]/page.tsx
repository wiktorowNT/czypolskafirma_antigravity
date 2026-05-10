import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
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
  business_description?: string
  ownership_description?: string
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
  business_description: string | null
  ownership_description: string | null
  country_code: string | null
  website_url: string | null
  registry_url: string | null
  created_at: string | null
  verified_at: string | null
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

async function getCompanyData(slugOrId: string): Promise<CompanyDetail | null> {
  try {
    const decoded = decodeURIComponent(slugOrId)
    console.log("[v0] Fetching company with slugOrId:", decoded, "at", new Date().toISOString())

    const supabase = await getSupabaseServerClient()

    // Detect if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)

    let query = supabase
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
        business_description,
        ownership_description,
        country_code,
        website_url,
        registry_url,
        created_at,
        verified_at,
        categories (
          name,
          slug
        )
      `)

    if (isUuid) {
      query = query.eq("id", decoded)
    } else {
      // Normalize slug: lowercase and spaces to hyphens
      const normalizedSlug = decoded.toLowerCase().trim().replace(/\s+/g, "-")
      query = query.eq("slug", normalizedSlug)
    }

    const { data, error } = await query.maybeSingle()

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
      business_description: company.business_description || undefined,
      ownership_description: company.ownership_description || undefined,
      country_code: company.country_code || undefined,
      website_url: company.website_url || undefined,
      registry_url: company.registry_url || undefined,
      lastVerified: company.verified_at
        ? new Date(company.verified_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    }
  } catch (err) {
    console.error("[v0] Error in getCompanyData:", err)
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  const company = await getCompanyData(slug)

  if (!company) {
    return {
      title: "Firma nie znaleziona | CzyPolskaFirma",
      description: "Nie znaleziono profilu firmy w bazie danych CzyPolskaFirma.",
    }
  }

  const isPolish = company.country_code?.toUpperCase() === "PL"
  const status = isPolish ? "Polska Firma" : "Firma Zagraniczna"

  const displaySlug = company.slug || company.id

  return {
    title: `Czy ${company.name} to polska firma? Sprawdź kapitał i właściciela`,
    description: `Dowiedz się, czy ${company.name} posiada polski kapitał. Status: ${status}. Sprawdź strukturę właścicielską, siedzibę i pochodzenie firmy ${company.name}.`,
    alternates: {
      canonical: `https://czypolskafirma.pl/firma/${displaySlug}`,
    },
    openGraph: {
      title: `Czy ${company.name} to polska firma?`,
      description: `Sprawdź pochodzenie kapitału i właściciela firmy ${company.name}. Aktualny status: ${status}.`,
      type: "website",
      url: `https://czypolskafirma.pl/firma/${displaySlug}`,
    },
  }
}

export default async function CompanyProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const company = await getCompanyData(slug)

  if (!company) {
    notFound()
  }

  // Handle redirect from UUID or non-normalized slug to canonical slug
  const decoded = decodeURIComponent(slug)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)

  if ((isUuid || decoded !== company.slug) && company.slug) {
    redirect(`/firma/${company.slug}`)
  }

  const isPolish = company.country_code?.toUpperCase() === "PL"
  const status = isPolish ? "polska firma" : "firma zagraniczna"
  const displaySlug = company.slug || company.id

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": company.name,
        "url": company.website_url || `https://czypolskafirma.pl/firma/${displaySlug}`,
        "logo": company.logoUrl,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": company.adres,
          "addressCountry": company.country_code
        },
        "description": company.business_description
      },
      {
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": `Czy ${company.name} to polska firma?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${company.name} to ${status}. ${company.ownership_description || ""}`
          }
        }]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Start",
            "item": "https://czypolskafirma.pl"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": company.categoryName,
            "item": `https://czypolskafirma.pl/kategoria/${company.categorySlug}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": company.name,
            "item": `https://czypolskafirma.pl/firma/${displaySlug}`
          }
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CompanyProfileClient company={company} />
    </>
  )
}
