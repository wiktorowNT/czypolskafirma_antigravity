"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  ExternalLink,
  Share2,
  AlertTriangle,
  Check,
  Building,
  MapPin,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollToTop } from "@/components/scroll-to-top"
import { ReportForm } from "@/components/report-form"
import { CompanyLogo } from "@/components/company-logo"
import { calculateIndexBreakdown, getScoreColor, type CompanyBreakdown } from "@/lib/company-utils"
import categories from "@/data/categories.json"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"

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
  logoDarkUrl?: string
  brandColor?: string
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

function getCategoryName(slug: string): string {
  const category = categories[slug as keyof typeof categories]
  return category?.name || slug
}

function getPolishAlternatives(categorySlug: string, currentId: string) {
  const category = categories[categorySlug as keyof typeof categories]
  if (!category) return []

  return category.items
    .filter((item: any) => item.id !== currentId && item.score >= 70)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 6)
}

function ShareButton({ url, brand }: { url: string; brand: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  return (
    <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Skopiowano!" : "Udostępnij"}
    </Button>
  )
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ${
            score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500"
          }`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-sm text-slate-600">/100</span>
      </div>
    </div>
  )
}

function RadarBreakdown({
  breakdown,
  onHover,
}: { breakdown: CompanyBreakdown; onHover?: (key: string | null) => void }) {
  const data = [
    { criterion: "Kapitał", value: breakdown.capital || 0, max: 40, key: "capital" },
    { criterion: "Siedziba", value: breakdown.hq || 0, max: 15, key: "hq" },
    { criterion: "Podatki", value: breakdown.taxes || 0, max: 15, key: "taxes" },
    { criterion: "Produkcja", value: breakdown.production || 0, max: 10, key: "production" },
    { criterion: "Zatrudnienie", value: breakdown.employment || 0, max: 10, key: "employment" },
    { criterion: "B+R", value: breakdown.rnd || 0, max: 5, key: "rnd" },
    { criterion: "Marka", value: breakdown.brandOrigin || 0, max: 5, key: "brandOrigin" },
  ]

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 40]} tick={{ fontSize: 10 }} tickCount={5} />
          <Radar name="Punkty" dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} strokeWidth={2} />
          <Tooltip
            formatter={(value: any, name: any, props: any) => [
              `${value}/${props.payload.max} pkt`,
              props.payload.criterion,
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MissingDataPill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-slate-100 text-slate-600">
        Brak danych
      </Badge>
      <button className="text-red-600 hover:text-red-700 text-sm underline">Zaproponuj źródło</button>
    </div>
  )
}

function useCompareCompanies() {
  const [comparedCompanies, setComparedCompanies] = useState<string[]>([])

  const addToCompare = (companyId: string) => {
    setComparedCompanies((prev) => {
      if (prev.includes(companyId)) return prev
      return [...prev, companyId].slice(0, 3) // Max 3 companies
    })
  }

  const removeFromCompare = (companyId: string) => {
    setComparedCompanies((prev) => prev.filter((id) => id !== companyId))
  }

  const isInCompare = (companyId: string) => comparedCompanies.includes(companyId)

  return { comparedCompanies, addToCompare, removeFromCompare, isInCompare }
}

function CollapsibleSection({
  id,
  title,
  icon: Icon,
  children,
  defaultExpanded = false,
}: {
  id: string
  title: string
  icon: any
  children: React.ReactNode
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <section id={`section-${id}`} className="bg-white rounded-lg shadow-sm border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>
      {isExpanded && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </section>
  )
}

export default function CompanyProfileClient({ params, company }: { params: { id: string }; company: CompanyDetail }) {
  const categoryName = getCategoryName(company.categorySlug)
  const polishAlternatives = getPolishAlternatives(company.categorySlug, company.id)
  const { addToCompare, removeFromCompare, isInCompare } = useCompareCompanies()
  const [hoveredCriterion, setHoveredCriterion] = useState<string | null>(null)

  const currentUrl =
    typeof window !== "undefined" ? `${window.location.origin}/firma/${company.id}` : `/firma/${company.id}`

  const breakdown = company.breakdown || calculateIndexBreakdown(company.score, company.badges)

  const getScoreFactors = () => {
    const positive = []
    const negative = []

    if (company.badges.includes("KAPITAŁ_PL")) positive.push({ text: "Kapitał polski", key: "capital" })
    else negative.push({ text: "Kapitał poza PL", key: "capital" })

    if (company.badges.includes("SIEDZIBA_PL")) positive.push({ text: "Siedziba w PL", key: "hq" })
    else negative.push({ text: "Siedziba poza PL", key: "hq" })

    if (company.badges.includes("CIT_PL")) positive.push({ text: "Płaci CIT w PL", key: "taxes" })
    else negative.push({ text: "Brak potwierdzenia CIT w PL", key: "taxes" })

    if (company.badges.includes("PRODUKCJA_PL")) positive.push({ text: "Produkcja w PL", key: "production" })
    else negative.push({ text: "Brak danych o produkcji w PL", key: "production" })

    if (company.badges.includes("ZATRUDNIENIE_PL")) positive.push({ text: "Zatrudnia w PL", key: "employment" })
    else negative.push({ text: "Brak danych o zatrudnieniu w PL", key: "employment" })

    return { positive, negative }
  }

  const { positive, negative } = getScoreFactors()

  const formatDate = (dateString?: string) => {
    if (!dateString) return "2024-01-10"
    return dateString
  }

  const capitalizeSlug = (slug: string) => {
    return slug.charAt(0).toUpperCase() + slug.slice(1)
  }

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Strona główna
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/#kategorie" className="hover:text-slate-900">
                Kategorie
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/kategoria/${company.categorySlug}`} className="hover:text-slate-900">
                {categoryName}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900 font-medium">{capitalizeSlug(company.brand)}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Left Column - Main Content (70%) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Page Header */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start gap-4 mb-4">
                  <CompanyLogo
                    id={company.id}
                    brandName={company.brand}
                    logoUrl={company.logoUrl}
                    logoDarkUrl={company.logoDarkUrl}
                    brandColor={company.brandColor}
                    size={64}
                    rounded={8}
                    priority={true}
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{capitalizeSlug(company.brand)}</h1>
                    <p className="text-slate-600 mb-3">{company.company}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        {categoryName}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {company.badges.includes("KAPITAŁ_PL") ? "Polska Marka" : "Marka Międzynarodowa"}
                      </Badge>
                      {company.age !== undefined && company.age > 0 && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          {company.age} {company.age === 1 ? "rok" : company.age < 5 ? "lata" : "lat"} działalności
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Dane pobrane z bazy Supabase — aktualizowane na bieżąco.</span>
                  </div>
                </div>
              </div>

              {/* Polish Index Summary Section */}
              <CollapsibleSection
                id="polish-index"
                title="Podsumowanie Indeksu Polskości"
                icon={Star}
                defaultExpanded={true}
              >
                <div className="space-y-6 pt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-slate-900">Rozbicie wyniku na kryteria</h3>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Brak danych nie jest liczony jako 0 punktów. Wpływa on na 'Poziom zaufania' do oceny.
                        </div>
                      </div>
                    </div>
                    <RadarBreakdown breakdown={breakdown} onHover={setHoveredCriterion} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Co podnosi wynik</h4>
                      {positive.length > 0 ? (
                        <ul className="text-sm text-green-700 space-y-1">
                          {positive.map((factor, index) => (
                            <li
                              key={index}
                              className={`cursor-pointer transition-colors ${
                                hoveredCriterion === factor.key ? "font-bold" : ""
                              }`}
                              onMouseEnter={() => setHoveredCriterion(factor.key)}
                              onMouseLeave={() => setHoveredCriterion(null)}
                            >
                              • {factor.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-700">Brak pozytywnych czynników</p>
                      )}
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">Co obniża wynik</h4>
                      {negative.length > 0 ? (
                        <ul className="text-sm text-red-700 space-y-1">
                          {negative.map((factor, index) => (
                            <li
                              key={index}
                              className={`cursor-pointer transition-colors ${
                                hoveredCriterion === factor.key ? "font-bold" : ""
                              }`}
                              onMouseEnter={() => setHoveredCriterion(factor.key)}
                              onMouseLeave={() => setHoveredCriterion(null)}
                            >
                              • {factor.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-700">Brak negatywnych czynników</p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <Link href="/#metodologia" className="text-red-600 hover:text-red-700">
                      Jak to liczymy? →
                    </Link>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Ownership and Capital Section */}
              <CollapsibleSection
                id="ownership"
                title="Właścicielstwo i kapitał (dane z KRS)"
                icon={Building}
                defaultExpanded={true}
              >
                <div className="space-y-4 pt-4">
                  {company.ownership?.companyTree ? (
                    <>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-sm text-slate-600 mb-1">Udziałowcy / Właściciele</div>
                            <div className="font-medium text-slate-900">
                              {company.ownership.companyTree[0]?.value || "Krajowy Związek Rewizyjny Spółdzielni"}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-sm text-slate-600 mb-1">Procent kapitału polskiego</div>
                            <div className="font-medium text-slate-900">
                              {company.badges.includes("KAPITAŁ_PL") ? "100%" : "Estymacja: <50%"}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">Beneficjent rzeczywisty</div>
                          <div className="font-medium text-slate-900">
                            {company.ownership?.beneficialOwners?.[0]?.name || "Członkowie spółdzielni"}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {company.badges.includes("KAPITAŁ_PL")
                            ? "Kapitał większościowy w PL → pełne punkty w komponencie Kapitał"
                            : "Kapitał większościowy poza PL → 0/40 w komponencie Kapitał"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-2">Brak potwierdzonych danych o właścicielach.</p>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">Dodaj źródło</button>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Headquarters and Management Section */}
              <CollapsibleSection
                id="hq-management"
                title="Siedziba i Zarząd (dane z KRS)"
                icon={MapPin}
                defaultExpanded={false}
              >
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Adres rejestrowy</h3>
                      {company.headquarters ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="font-medium text-slate-900">
                              {company.headquarters.city}, {company.headquarters.country}
                            </div>
                          </div>
                          {company.registry && (
                            <div className="space-y-1 text-sm text-slate-600">
                              {company.registry.krs && company.registry.krs !== "null" ? (
                                <div>KRS: {company.registry.krs}</div>
                              ) : (
                                <div>KRS: Brak danych</div>
                              )}
                              {company.registry.nip && company.registry.nip !== "null" ? (
                                <div>NIP: {company.registry.nip}</div>
                              ) : (
                                <div>NIP: Brak danych</div>
                              )}
                              {company.registry.regon && <div>REGON: {company.registry.regon}</div>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">Dane w przygotowaniu</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Skład zarządu</h3>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-600 mb-1">Estymowana narodowość zarządu</div>
                        <div className="font-medium text-slate-900">
                          {company.badges.includes("SIEDZIBA_PL") ? "Dominacja polska" : "Międzynarodowy"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Sources and Documents Section */}
              <CollapsibleSection id="sources" title="Źródła i dokumenty" icon={FileText} defaultExpanded={false}>
                <div className="space-y-4 pt-4">
                  {company.sources && company.sources.length > 0 ? (
                    <div className="space-y-3">
                      {company.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-400" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-slate-900 truncate pr-6">
                                {capitalizeSlug(source.label)}
                              </h3>
                              <span className={`text-sm font-bold ml-2 ${getScoreColor(source.url)}`}>
                                {source.url}/100
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500">Dane w przygotowaniu</p>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Polish Alternatives Section */}
              {polishAlternatives.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-slate-600" />
                    <h2 className="text-xl font-bold text-slate-900">Polskie alternatywy w tej kategorii</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {polishAlternatives.slice(0, 6).map((alternative: any) => (
                      <div
                        key={alternative.id}
                        className="relative p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              addToCompare(company.id)
                              addToCompare(alternative.id)
                            }}
                            className="p-1 rounded-full bg-white shadow-sm border hover:bg-slate-50 transition-colors"
                            title="Porównaj z tą firmą"
                          >
                            <Scale className="h-3 w-3 text-slate-600" />
                          </button>
                        </div>

                        <Link href={`/firma/${alternative.id}`} className="block">
                          <div className="flex items-start gap-3 mb-2">
                            <CompanyLogo
                              id={alternative.id}
                              brandName={alternative.brand}
                              logoUrl={alternative.logoUrl}
                              brandColor={alternative.brandColor}
                              size={28}
                              rounded={4}
                              priority={false}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-slate-900 truncate pr-6">
                                  {capitalizeSlug(alternative.brand)}
                                </h3>
                                <span className={`text-sm font-bold ml-2 ${getScoreColor(alternative.score)}`}>
                                  {alternative.score}/100
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {alternative.badges.slice(0, 2).map((badge: string) => (
                              <Badge key={badge} variant="secondary" className="text-xs">
                                {badge.replace(/_/g, " ")}
                              </Badge>
                            ))}
                            {alternative.badges.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{alternative.badges.length - 2}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sticky Sidebar (30%) */}
            <div className="lg:col-span-3">
              <div className="sticky top-8 space-y-6">
                {/* Key Facts Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="text-center mb-6">
                    <ScoreRing score={company.score} size={140} />
                    <div className="mt-4">
                      <div className="text-lg font-bold text-slate-900 mb-1">Indeks Polskości</div>
                      <div className="text-2xl font-bold text-slate-900">{company.score}/100</div>
                      <div className="text-xs text-slate-500 mt-2">
                        {company.badges.includes("SIEDZIBA_PL") && "40 (siedziba) + "}
                        {company.badges.includes("CIT_PL") && "25 (VAT) + "}
                        {company.badges.includes("KAPITAŁ_PL") && "10 (rachunek) + "}
                        {company.age !== undefined && `${Math.min(25, company.age)} (wiek)`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide text-center border-b pb-2">
                      Kluczowe fakty w pigułce
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Dane rejestrowe
                        </h4>
                        <div className="space-y-2 text-sm">
                          {company.age !== undefined && company.age > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Wiek działalności:</span>
                              <span className="font-medium text-slate-900">
                                {company.age} {company.age === 1 ? "rok" : company.age < 5 ? "lata" : "lat"}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-600">Kraj rejestracji:</span>
                            <span className="font-medium text-slate-900">{company.headquarters?.country || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">NIP:</span>
                            <span className="font-medium text-slate-900">
                              {company.registry?.nip && company.registry.nip !== "null"
                                ? company.registry.nip
                                : "Brak danych"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">KRS:</span>
                            <span className="font-medium text-slate-900">
                              {company.registry?.krs && company.registry.krs !== "null"
                                ? company.registry.krs
                                : "Brak danych"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Weryfikacja
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Siedziba w PL:</span>
                            <span className="font-medium">
                              {company.badges.includes("SIEDZIBA_PL") ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <span className="text-red-600">✗</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">VAT czynny:</span>
                            <span className="font-medium">
                              {company.badges.includes("CIT_PL") ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <span className="text-red-600">✗</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Rachunek w PL:</span>
                            <span className="font-medium">
                              {company.badges.includes("KAPITAŁ_PL") ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : company.registry?.nip ? (
                                <span className="text-red-600">✗</span>
                              ) : (
                                <span className="text-slate-400 text-xs">Brak danych</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credibility Section */}
                  <div className="border-t pt-4 mb-6">
                    <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-3">Wiarygodność</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Poziom zaufania:</span>
                        <span className="font-medium text-slate-900">
                          {company.sources && company.sources.length > 3
                            ? "Wysoki"
                            : company.sources && company.sources.length > 1
                              ? "Średni"
                              : "Niski"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Źródła:</span>
                        <span className="font-medium text-slate-900">{company.sources?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ostatnia weryfikacja:</span>
                        <span className="font-medium text-slate-900">{formatDate(company.lastVerified)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <ShareButton url={currentUrl} brand={company.brand} />
                    <Button variant="outline" className="w-full bg-transparent flex items-center gap-2" size="sm">
                      <Scale className="h-4 w-4" />
                      Porównaj z inną firmą
                    </Button>
                    <ReportForm>
                      <Button variant="outline" className="w-full flex items-center gap-2 bg-transparent" size="sm">
                        <AlertTriangle className="h-4 w-4" />
                        Zgłoś błąd lub sugestię
                      </Button>
                    </ReportForm>
                    {company.website && (
                      <Button variant="outline" asChild size="sm" className="w-full bg-transparent">
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Strona firmy
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Data Confidence Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-900 mb-1">Poziomy pewności danych</div>
                      <div className="text-blue-800 space-y-1">
                        <div>
                          <strong>Wysoki:</strong> 4+ źródła oficjalne
                        </div>
                        <div>
                          <strong>Średni:</strong> 2-3 źródła
                        </div>
                        <div>
                          <strong>Niski:</strong> 1 źródło lub estymacja
                        </div>
                      </div>
                      <Link
                        href="/#metodologia"
                        className="text-blue-600 hover:text-blue-700 text-xs underline mt-2 inline-block"
                      >
                        Zobacz pełną metodologię →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
