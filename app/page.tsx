import type { Metadata } from "next"
import Hero from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { HomeBlogSection } from "@/components/home-blog-section"
import { Methodology } from "@/components/methodology"
import { ReportForm } from "@/components/report-form"
import { FAQ } from "@/components/faq"
import { CookieBanner } from "@/components/cookie-banner"
import { GlobalStats } from "@/components/global-stats"
import { SupportSection } from "@/components/support-section"
import { WhyPolish } from "@/components/WhyPolish"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"

export const revalidate = 3600 // ISR: odśwież dane hero co godzinę

export const metadata: Metadata = {
  alternates: {
    canonical: "https://czypolskafirma.pl",
  },
}

export interface HeroCategory {
  id: string
  name: string
  slug: string
  icon?: string | null
}

export interface HeroPopularTag {
  id: string
  slug: string
  displayName: string
  website_url: string | null
  country_code: string | null
}

// Dane sekcji "Kategorie firm" i "Popularne wyszukiwania" pobierane server-side,
// żeby linki <a> do /kategoria/* i /firma/* były w wyjściowym HTML (crawlowalne).
async function getHeroData(): Promise<{
  categories: HeroCategory[]
  companyCount: number | null
  popularTags: HeroPopularTag[]
  recentCompanies: HeroPopularTag[]
}> {
  const result: {
    categories: HeroCategory[]
    companyCount: number | null
    popularTags: HeroPopularTag[]
    recentCompanies: HeroPopularTag[]
  } = {
    categories: [],
    companyCount: null,
    popularTags: [],
    recentCompanies: [],
  }

  try {
    const supabase = await getSupabaseServerClient()

    const [categoriesRes, countRes, popularRes, recentRes] = await Promise.all([
      supabase.from("categories").select("id, name, slug, icon").order("name", { ascending: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      (async () => {
        const since = new Date()
        since.setDate(since.getDate() - 30)
        return supabase.rpc("get_popular_companies", {
          since_date: since.toISOString(),
          result_limit: 6,
        })
      })(),
      supabase
        .from("companies")
        .select("id, slug, name, display_name, website_url, country_code")
        .order("created_at", { ascending: false })
        .limit(4),
    ])

    if (!categoriesRes.error && categoriesRes.data) {
      result.categories = categoriesRes.data
    }
    if (!countRes.error && typeof countRes.count === "number") {
      result.companyCount = countRes.count
    }
    if (!recentRes.error && Array.isArray(recentRes.data)) {
      result.recentCompanies = recentRes.data.map((c: any) => ({
        id: c.id,
        slug: c.slug ? slugify(c.slug) : c.id,
        displayName: resolveDisplayName(c.display_name, c.slug, c.name),
        website_url: c.website_url || null,
        country_code: c.country_code || null,
      }))
    }
    if (!popularRes.error && Array.isArray(popularRes.data)) {
      result.popularTags = popularRes.data.map((c: any) => ({
        id: c.id,
        slug: c.slug ? slugify(c.slug) : c.id,
        // Uwaga: aby display_name działało tu w pełni, funkcja RPC get_popular_companies
        // musi zwracać kolumnę display_name. Bez tego następuje fallback na slug (bez regresji).
        displayName: resolveDisplayName(c.display_name, c.slug, c.name),
        website_url: c.website_url || null,
        country_code: c.country_code || null,
      }))
    }
  } catch (error) {
    console.error("[home] Błąd pobierania danych hero:", error)
  }

  return result
}

export default async function Home() {
  const { categories, companyCount, popularTags, recentCompanies } = await getHeroData()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <Hero
          initialCategories={categories}
          initialCompanyCount={companyCount}
          initialPopularTags={popularTags}
          initialRecentCompanies={recentCompanies}
        />
        <GlobalStats />
        <HowItWorks />
        <HomeBlogSection />
        <Methodology />
        <WhyPolish />
        <ReportForm />
        <SupportSection />
        <FAQ />
      </main>
      <CookieBanner />
    </div>
  )
}
