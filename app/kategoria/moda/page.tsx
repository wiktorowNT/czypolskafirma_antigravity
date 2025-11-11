import type { Metadata } from "next"
import { Suspense } from "react"
import ScrollToTop from "@/components/scroll-to-top"
import CategoryPageView from "@/components/category-page-view"
import { getCachedCategoryData } from "@/lib/supabase/category-cache"

export const metadata: Metadata = {
  title: "Moda - Czy Polska Firma",
  description: "Sprawdź indeks polskości marek modowych. Odzież i akcesoria - które firmy są polskie?",
  openGraph: {
    title: "Moda - Czy Polska Firma",
    description: "Sprawdź indeks polskości marek modowych. Odzież i akcesoria - które firmy są polskie?",
  },
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ModaPage() {
  try {
    const categoryData = await getCachedCategoryData("moda")

    if (!categoryData.companies || categoryData.companies.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50">
          <ScrollToTop />
          <div className="container mx-auto px-4 py-12 text-center">
            <p className="text-gray-600">Brak firm w tej kategorii.</p>
          </div>
        </div>
      )
    }

    const category = {
      slug: "moda",
      name: "Moda i akcesoria",
      short: "Odzież, obuwie, biżuteria i dodatki",
      items: categoryData.companies,
    }

    console.log(`[v0] ModaPage: Loaded ${categoryData.companies.length} companies from Supabase`)

    return (
      <div className="min-h-screen bg-slate-50">
        <ScrollToTop />
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Ładowanie...</div>}>
          <CategoryPageView category={category} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("[v0] Error in ModaPage:", error)
    return (
      <div className="min-h-screen bg-slate-50">
        <ScrollToTop />
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">Błąd przy ładowaniu kategorii. Spróbuj odświeżyć stronę.</div>
        </div>
      </div>
    )
  }
}
