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
import { getHomeData } from "@/lib/home-data"

export type { HeroCategory, HeroPopularTag } from "@/lib/home-data"

export const revalidate = 3600 // ISR: odśwież dane strony głównej co godzinę

export const metadata: Metadata = {
  alternates: {
    canonical: "https://czypolskafirma.pl",
  },
}

// Dane (kategorie, popularne firmy, statystyki, przykładowy wynik) pobierane server-side,
// żeby linki <a> do /kategoria/* i /firma/* były w wyjściowym HTML (crawlowalne).
export default async function Home() {
  const { categories, companyCount, popularTags, recentCompanies, sample, surprises, stats } = await getHomeData()

  return (
    <div className="min-h-screen bg-background text-ink">
      <main>
        <Hero
          initialCategories={categories}
          initialCompanyCount={companyCount}
          initialPopularTags={popularTags}
          initialRecentCompanies={recentCompanies}
          sample={sample}
          surprises={surprises}
        />
        <GlobalStats initialStats={stats} />
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
