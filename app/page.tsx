import Hero from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { Features } from "@/components/features"
import { Methodology } from "@/components/methodology"
import { ReportForm } from "@/components/report-form"
import { FAQ } from "@/components/faq"
import { CookieBanner } from "@/components/cookie-banner"
import { GlobalStats } from "@/components/global-stats"
import { SupportSection } from "@/components/support-section"
import { WhyPolish } from "@/components/WhyPolish"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <Hero />
        <GlobalStats />
        <HowItWorks />
        <Features />
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