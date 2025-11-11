import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ExternalLink, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollToTop } from "@/components/scroll-to-top"
import { ReportForm } from "@/components/report-form"
import categoriesData from "@/data/categories.json"

interface CompanyProfilePageProps {
  params: {
    slug: string
    id: string
  }
}

const badgeLabels: Record<string, string> = {
  PL_CAPITAL_50: "Kapitał PL >50%",
  CIT_PL: "CIT w PL",
  HQ_PL: "Siedziba w PL",
  EMPLOYMENT_PL: "Zatrudnienie PL",
  RD_PL: "B+R w PL",
  PRODUCTION_PL_PARTIAL: "Produkcja w PL",
  BRAND_FROM_PL: "Marka z PL",
  COOP: "Spółdzielnia",
  COOP_NETWORK: "Sieć spółdzielcza",
}

const scoreBreakdownLabels: Record<string, string> = {
  capital: "Kapitał",
  hq: "Siedziba",
  taxes: "Podatki",
  production: "Produkcja",
  employment: "Zatrudnienie",
  rd: "B+R",
  brand: "Marka",
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

function getBarColor(value: number, maxValue: number): string {
  const percentage = (value / maxValue) * 100
  if (percentage >= 70) return "bg-green-500"
  if (percentage >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export default function CompanyProfilePage({ params }: CompanyProfilePageProps) {
  const { slug, id } = params

  // Find category
  const category = Object.values(categoriesData).find((cat) => cat.slug === slug)
  if (!category) {
    notFound()
  }

  // Find company
  const company = category.items.find((item) => item.id === id)
  if (!company) {
    notFound()
  }

  // Get similar companies (3 random companies from same category, excluding current)
  const similarCompanies = category.items
    .filter((item) => item.id !== id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  // Get random facts for display
  const displayFacts = company.facts.slice(0, 3)

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-8">
            <Link href="/" className="hover:text-slate-900">
              Strona główna
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/#kategorie" className="hover:text-slate-900">
              Kategorie
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/kategoria/${slug}`} className="hover:text-slate-900">
              {category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{company.brand}</span>
          </nav>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {company.brand}
                  <span className="text-xl font-normal text-slate-600 ml-2">({company.company})</span>
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="text-xs">
                      {badgeLabels[badge] || badge}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="text-4xl font-bold text-slate-900 mb-2">{company.score}/100</div>
                <div className="w-32 h-3 bg-slate-200 rounded-full overflow-hidden mx-auto lg:mx-0">
                  <div
                    className={`h-full ${getScoreColor(company.score)} transition-all duration-300`}
                    style={{ width: `${company.score}%` }}
                    aria-label={`Indeks polskości ${company.score} na 100`}
                  />
                </div>
                <div className="text-sm text-slate-600 mt-1">Indeks polskości</div>
              </div>
            </div>
          </div>

          {/* Polish Index Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Indeks polskości</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(company.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-lg font-semibold text-slate-900 mb-2">{scoreBreakdownLabels[key]}</div>
                  <div className="w-full h-24 bg-slate-200 rounded-lg overflow-hidden mb-2 relative">
                    <div
                      className={`absolute bottom-0 left-0 right-0 ${getBarColor(value, 40)} transition-all duration-500`}
                      style={{ height: `${Math.max((value / 40) * 100, 5)}%` }}
                      aria-label={`${scoreBreakdownLabels[key]}: ${value} punktów`}
                    />
                  </div>
                  <div className="text-sm font-medium text-slate-700">{value} pkt</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Dlaczego ten indeks?</strong> Metodologia uwzględnia kapitał, siedzibę, podatki, produkcję,
                zatrudnienie, B+R i pochodzenie marki.
                <Link href="/metodologia" className="underline hover:no-underline ml-1">
                  Zobacz pełną metodologię →
                </Link>
              </p>
            </div>
          </div>

          {/* Company History */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Historia firmy</h2>
            <p className="text-slate-700 leading-relaxed">{company.history}</p>
          </div>

          {/* Ownership Structure */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Struktura własności</h2>
            <p className="text-slate-700 leading-relaxed mb-6">{company.ownership}</p>

            {displayFacts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Kluczowe informacje:</h3>
                <ul className="space-y-2">
                  {displayFacts.map((fact, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sources and Verification */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Źródła i weryfikacja</h2>
            <div className="space-y-3 mb-4">
              {company.sources.map((source, index) => (
                <div key={index} className="flex items-center">
                  <ExternalLink className="w-4 h-4 text-slate-500 mr-2" />
                  <a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {source}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600">
              Ostatnia weryfikacja: {new Date(company.verificationDate).toLocaleDateString("pl-PL")}
            </p>
          </div>

          {/* Similar Companies */}
          {similarCompanies.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Podobne firmy w kategorii</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similarCompanies.map((similar) => (
                  <Link
                    key={similar.id}
                    href={`/kategoria/${slug}/${similar.id}`}
                    className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="font-semibold text-slate-900 mb-1">{similar.brand}</div>
                    <div className="text-sm text-slate-600 mb-2">{similar.company}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-slate-900">{similar.score}/100</div>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(similar.score)}`}
                          style={{ width: `${similar.score}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Report Error Button */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Znalazłeś błąd?</h3>
                <p className="text-slate-600">Pomóż nam poprawić dane o tej firmie</p>
              </div>
              <ReportForm>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <AlertTriangle className="w-4 h-4" />
                  Zgłoś poprawkę
                </Button>
              </ReportForm>
            </div>
          </div>

          {/* Disclaimer and Back Link */}
          <div className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Uwaga:</strong> Wartości demonstracyjne — nie są danymi rzeczywistymi.
              </p>
            </div>
            <Link
              href={`/kategoria/${slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Wróć do listy {category.name.toLowerCase()}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
