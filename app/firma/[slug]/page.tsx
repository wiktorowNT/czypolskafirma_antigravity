import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import CompanyProfileClient from "./CompanyProfileClient"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName, cleanAddress } from "@/lib/slug-utils"
import { buildCompanyFaqItems, getCountryName } from "@/lib/company-faq"
import { serializeJsonLd } from "@/lib/json-ld"

export const revalidate = 3600 // ISR: revalidate every hour

const BASE_URL = "https://czypolskafirma.pl"

interface CompanyDetail {
  id: string
  name: string
  slug: string // surowy slug z bazy
  canonicalSlug: string // kanoniczny slug URL (slugify)
  brandName: string // nazwa marki (to samo co w H1)
  categoryId?: string
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

export interface RelatedCompany {
  id: string
  slug: string
  brand: string
  website_url?: string
  country_code?: string
}

interface SupabaseCompany {
  id: string
  name: string
  slug: string
  display_name: string | null
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
  category_id: string | null
  created_at: string | null
  verified_at: string | null
  categories?: {
    name: string
    slug: string
  }
}

const COMPANY_SELECT = `
  id,
  name,
  slug,
  display_name,
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
  category_id,
  created_at,
  verified_at,
  categories (
    name,
    slug
  )
`

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

function mapCompany(data: SupabaseCompany): CompanyDetail {
  const company = data
  const age = calculateAge(company.founded_at)
  const rawSlug = company.slug || ""

  return {
    id: company.id,
    name: company.name,
    slug: rawSlug,
    canonicalSlug: slugify(rawSlug) || company.id,
    brandName: resolveDisplayName(company.display_name, rawSlug, company.name),
    categoryId: company.category_id || undefined,
    categorySlug: company.categories?.slug || "inne",
    categoryName: company.categories?.name || "Inne",
    nip: company.nip || undefined,
    krs: company.krs || undefined,
    siedziba_pl: company.siedziba_pl,
    vat_czynny: company.vat_czynny,

    founded_at: company.founded_at || undefined,
    age,
    adres: cleanAddress(company.adres) || undefined,
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
}

async function getCompanyData(slugOrId: string): Promise<CompanyDetail | null> {
  try {
    const decoded = decodeURIComponent(slugOrId)

    const supabase = await getSupabaseServerClient()

    // Detect if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)

    let query = supabase.from("companies").select(COMPANY_SELECT)

    if (isUuid) {
      query = query.eq("id", decoded)
    } else {
      // Direct attempts: exact match, space->dash normalization, case-insensitive
      const normalizedSlug = decoded.toLowerCase().trim().replace(/\s+/g, "-")
      query = query.or(`slug.eq."${decoded}",slug.eq."${normalizedSlug}",slug.ilike."${decoded}"`)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error("[firma] Supabase error:", error)
      return null
    }

    if (data) {
      return mapCompany(data as unknown as SupabaseCompany)
    }

    // Fallback: kanoniczne dopasowanie po slugify — obsługuje stare/niekanoniczne URL-e
    // (spacje, nawiasy, kropki, polskie znaki, wielkie litery) oraz nowe kanoniczne slugi
    // dla "surowych" slugów w bazie (np. /firma/dm-drogerie-markt -> slug "DM (Drogerie Markt)").
    if (!isUuid) {
      const wanted = slugify(decoded)
      if (wanted) {
        const { data: allSlugs, error: slugsError } = await supabase
          .from("companies")
          .select("id, slug")

        if (!slugsError && allSlugs) {
          const match = allSlugs.find((c: { id: string; slug: string | null }) => c.slug && slugify(c.slug) === wanted)
          if (match) {
            const { data: full, error: fullError } = await supabase
              .from("companies")
              .select(COMPANY_SELECT)
              .eq("id", match.id)
              .maybeSingle()
            if (!fullError && full) {
              return mapCompany(full as unknown as SupabaseCompany)
            }
          }
        }
      }
    }

    return null
  } catch (err) {
    console.error("[firma] Error in getCompanyData:", err)
    return null
  }
}

async function getRelatedCompanies(company: CompanyDetail): Promise<RelatedCompany[]> {
  if (!company.categoryId) return []
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("companies")
      .select("id, slug, name, display_name, website_url, country_code")
      .eq("category_id", company.categoryId)
      .neq("id", company.id)
      .order("name", { ascending: true })
      .limit(24)

    if (error || !data) return []

    // Polskie firmy najpierw, potem pozostałe z tej samej kategorii — max 8 linków
    const mapped: RelatedCompany[] = data.map((c: any) => ({
      id: c.id,
      slug: slugify(c.slug || "") || c.id,
      brand: resolveDisplayName(c.display_name, c.slug, c.name),
      website_url: c.website_url || undefined,
      country_code: c.country_code || undefined,
    }))

    const polish = mapped.filter((c) => c.country_code?.toUpperCase() === "PL")
    const foreign = mapped.filter((c) => c.country_code?.toUpperCase() !== "PL")
    return [...polish, ...foreign].slice(0, 8)
  } catch (err) {
    console.error("[firma] Error in getRelatedCompanies:", err)
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  const company = await getCompanyData(slug)

  if (!company) {
    return {
      title: "Firma nie znaleziona",
      description: "Nie znaleziono profilu firmy w bazie danych CzyPolskaFirma.",
      robots: { index: false, follow: false },
    }
  }

  const brand = company.brandName
  const countryName = getCountryName(company.country_code)
  const owner = company.owner_name || company.parent_company_name

  // Sufiks "| CzyPolskaFirma.pl" dodaje title.template z layoutu — tu tylko część zmienna.
  const longTitle = `Czy ${brand} to polska firma? Kto jest właścicielem`
  const title = longTitle.length > 60 ? `Czy ${brand} to polska firma?` : longTitle

  const ownerPart = owner ? ` Właściciel: ${owner}.` : ""
  const description = `Sprawdź, czy ${brand} to polska firma. Kraj pochodzenia: ${countryName}.${ownerPart} Struktura kapitału, siedziba i dane rejestrowe.`

  const canonicalUrl = `${BASE_URL}/firma/${company.canonicalSlug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    // Obrazek OG (og:image + twitter:image) generuje dynamicznie
    // app/firma/[slug]/opengraph-image.tsx — nie ustawiamy tu images ręcznie,
    // aby uniknąć zdublowanych metatagów.
    openGraph: {
      title: `${title} | CzyPolskaFirma.pl`,
      description,
      type: "website",
      url: canonicalUrl,
      locale: "pl_PL",
      siteName: "CzyPolskaFirma",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CzyPolskaFirma.pl`,
      description,
      creator: "@CzyPolskaFirma",
    },
  }
}

export default async function CompanyProfilePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const company = await getCompanyData(slug)

  if (!company) {
    notFound() // nieistniejąca firma -> prawdziwe 404
  }

  // 301 z UUID i starych/niekanonicznych slugów (spacje, nawiasy, wielkie litery, polskie znaki)
  // na kanoniczny slug URL.
  const decoded = decodeURIComponent(slug)
  if (decoded !== company.canonicalSlug) {
    permanentRedirect(`/firma/${company.canonicalSlug}`)
  }

  const relatedCompanies = await getRelatedCompanies(company)

  const isPolish = company.country_code?.toUpperCase() === "PL"
  const brand = company.brandName
  const canonicalUrl = `${BASE_URL}/firma/${company.canonicalSlug}`

  // FAQ — te same pytania i odpowiedzi, które są widoczne na stronie (components/CompanyFAQ.tsx)
  const faqItems = buildCompanyFaqItems({
    brandName: brand,
    country_code: company.country_code,
    ownership_description: company.ownership_description,
    owner_name: company.owner_name,
    parent_company_name: company.parent_company_name,
    business_description: company.business_description,
    categoryName: company.categoryName,
    adres: company.adres,
    siedziba_pl: company.siedziba_pl,
    founded_at: company.founded_at,
    age: company.age,
  })

  const organizationJsonLd: Record<string, unknown> = {
    "@type": "Organization",
    name: brand,
    legalName: company.name,
    url: canonicalUrl,
    description: company.business_description,
  }
  if (company.adres) {
    organizationJsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: company.adres,
      addressCountry: "PL",
    }
  }
  if (company.nip) {
    organizationJsonLd.taxID = company.nip
  }
  if (!isPolish && (company.parent_company_name || company.owner_name)) {
    organizationJsonLd.parentOrganization = {
      "@type": "Organization",
      name: company.parent_company_name || company.owner_name,
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd,
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Start",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: company.categoryName,
            item: `${BASE_URL}/kategoria/${encodeURIComponent(company.categorySlug)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: brand,
            item: canonicalUrl,
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <CompanyProfileClient company={company} relatedCompanies={relatedCompanies} />
    </>
  )
}
