import Hero from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { PolishIndex } from "@/components/polish-index"
import { Features } from "@/components/features"
import { Categories } from "@/components/categories"
import { Methodology } from "@/components/methodology"
import { ReportForm } from "@/components/report-form"
import { FAQ } from "@/components/faq"
import { CookieBanner } from "@/components/cookie-banner"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <Hero />
        <HowItWorks />
        <PolishIndex />
        <Features />
        <Categories />
        <Methodology />
        <ReportForm />
        <FAQ />
      </main>
      <CookieBanner />
    </div>
  )
}
