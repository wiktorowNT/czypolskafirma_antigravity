"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Search,
  X,
  Filter,
  Building2,
  BarChart3,
  TrendingUp,
  Calendar,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import ComparisonPanel from "@/components/comparison-panel"
import ComparisonBar from "@/components/comparison-bar"
import { useComparison } from "@/hooks/use-comparison"
import companyDetailsData from "@/data/company-details.json"

interface CategoryItem {
  id: string
  brand: string
  company: string
  score: number
  badges: string[]
  logo?: string
  logoUrl?: string
  logoDarkUrl?: string
  brandColor?: string
}

interface Category {
  slug: string
  name: string
  short: string
  items: CategoryItem[]
}

interface CategoryPageViewProps {
  category: Category
}

type FilterState = "any" | "yes" | "no"

interface AdvancedFilters {
  headquarters: FilterState
  vatStatus: FilterState
  bankAccount: FilterState
  ageMin: number
  ageMax: number
}

const getPolishIndexComponents = (item: CategoryItem) => {
  const companyDetails = companyDetailsData[item.id as keyof typeof companyDetailsData]

  return {
    // 1. Siedziba/rejestr w Polsce (40%)
    headquarters: {
      weight: 40,
      value: item.badges.includes("HQ_PL") ? 100 : 0,
      status: item.badges.includes("HQ_PL") ? "✅" : "❌",
      label: "Siedziba w PL",
    },
    // 2. Status VAT "Czynny" (25%)
    vatStatus: {
      weight: 25,
      value: item.badges.includes("CIT_PL") ? 100 : 0,
      status: item.badges.includes("CIT_PL") ? "✅" : "❌",
      label: "VAT Czynny",
    },
    // 3. Polski rachunek bankowy (10%) - tylko jeśli VAT = "Czynny"
    bankAccount: {
      weight: 10,
      value: item.badges.includes("CIT_PL") && item.badges.includes("PL_CAPITAL_50") ? 100 : 0,
      status:
        item.badges.includes("CIT_PL") && item.badges.includes("PL_CAPITAL_50")
          ? "✅"
          : item.badges.includes("CIT_PL")
            ? "N/A"
            : "❌",
      label: "Rachunek w PL",
    },
    // 4. Wiek działalności (25%)
    businessAge: {
      weight: 25,
      value: companyDetails?.history
        ? Math.min(
            100,
            ((new Date().getFullYear() - Number.parseInt(companyDetails.history[0]?.date || "2000")) / 30) * 100,
          )
        : 50,
      status: companyDetails?.history
        ? `${new Date().getFullYear() - Number.parseInt(companyDetails.history[0]?.date || "2000")} lat`
        : "N/A",
      label: "Wiek działalności",
      years: companyDetails?.history
        ? new Date().getFullYear() - Number.parseInt(companyDetails.history[0]?.date || "2000")
        : null,
    },
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "from-green-500 to-green-600"
  if (score >= 40) return "from-yellow-500 to-orange-500"
  return "from-red-500 to-red-600"
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return "text-green-700"
  if (score >= 40) return "text-yellow-700"
  return "text-red-700"
}

export default function CategoryPageView({ category }: CategoryPageViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "score-desc")
  const [minScore, setMinScore] = useState(Number.parseInt(searchParams.get("minScore") || "0"))
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [expandedFilters, setExpandedFilters] = useState<string[]>(["advanced"])

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    headquarters: (searchParams.get("hq") as FilterState) || "any",
    vatStatus: (searchParams.get("vat") as FilterState) || "any",
    bankAccount: (searchParams.get("bank") as FilterState) || "any",
    ageMin: Number.parseInt(searchParams.get("ageMin") || "0"),
    ageMax: Number.parseInt(searchParams.get("ageMax") || "100"),
  })

  const {
    comparedCompanies,
    showComparisonPanel,
    addToComparison,
    removeFromComparison,
    clearComparison,
    openComparisonPanel,
    closeComparisonPanel,
  } = useComparison()

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set("q", searchTerm)
    if (sortBy !== "score-desc") params.set("sort", sortBy)
    if (minScore > 0) params.set("minScore", minScore.toString())
    if (advancedFilters.headquarters !== "any") params.set("hq", advancedFilters.headquarters)
    if (advancedFilters.vatStatus !== "any") params.set("vat", advancedFilters.vatStatus)
    if (advancedFilters.bankAccount !== "any") params.set("bank", advancedFilters.bankAccount)
    if (advancedFilters.ageMin > 0) params.set("ageMin", advancedFilters.ageMin.toString())
    if (advancedFilters.ageMax < 100) params.set("ageMax", advancedFilters.ageMax.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : ""
    if (newUrl !== window.location.search) {
      router.replace(`${window.location.pathname}${newUrl}`, { scroll: false })
    }
  }, [searchTerm, sortBy, minScore, advancedFilters, router])

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  const toggleCompare = (companyId: string, brandName: string) => {
    if (comparedCompanies.includes(companyId)) {
      removeFromComparison(companyId)
      showToastMessage("Usunięto z porównania")
    } else {
      const success = addToComparison(companyId)
      if (success) {
        showToastMessage("Dodano do porównania")
      } else {
        showToastMessage("Maksymalnie 3 firmy można porównać", "error")
      }
    }
  }

  const filteredAndSortedItems = useMemo(() => {
    const filtered = category.items.filter((item) => {
      if (
        searchTerm &&
        !item.brand.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.company.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }
      if (item.score < minScore) return false

      const components = getPolishIndexComponents(item)

      // Headquarters filter
      if (advancedFilters.headquarters !== "any") {
        const hasHQ = item.badges.includes("HQ_PL")
        if (advancedFilters.headquarters === "yes" && !hasHQ) return false
        if (advancedFilters.headquarters === "no" && hasHQ) return false
      }

      // VAT Status filter
      if (advancedFilters.vatStatus !== "any") {
        const hasVAT = item.badges.includes("CIT_PL")
        if (advancedFilters.vatStatus === "yes" && !hasVAT) return false
        if (advancedFilters.vatStatus === "no" && hasVAT) return false
      }

      // Bank Account filter
      if (advancedFilters.bankAccount !== "any") {
        const hasBank = item.badges.includes("CIT_PL") && item.badges.includes("PL_CAPITAL_50")
        const isNA = !item.badges.includes("CIT_PL")
        if (advancedFilters.bankAccount === "yes" && !hasBank) return false
        if (advancedFilters.bankAccount === "no" && (hasBank || isNA)) return false
      }

      // Age filter
      if (components.businessAge.years !== null) {
        const age = components.businessAge.years
        if (age < advancedFilters.ageMin || age > advancedFilters.ageMax) return false
      }

      return true
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score-asc":
          return a.score - b.score
        case "name-asc":
          return a.brand.localeCompare(b.brand)
        case "name-desc":
          return b.brand.localeCompare(a.brand)
        case "age-asc": {
          const ageA = getPolishIndexComponents(a).businessAge.years || 0
          const ageB = getPolishIndexComponents(b).businessAge.years || 0
          return ageA - ageB
        }
        case "age-desc": {
          const ageA = getPolishIndexComponents(a).businessAge.years || 0
          const ageB = getPolishIndexComponents(b).businessAge.years || 0
          return ageB - ageA
        }
        default:
          return b.score - a.score
      }
    })

    return filtered
  }, [category.items, searchTerm, sortBy, minScore, advancedFilters])

  const metrics = useMemo(() => {
    const scores = filteredAndSortedItems.map((item) => item.score)
    const average = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
    const median = scores.length > 0 ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0

    // Get latest verification date
    const verificationDates = filteredAndSortedItems
      .map((item) => companyDetailsData[item.id as keyof typeof companyDetailsData]?.lastVerified)
      .filter(Boolean)
      .sort()
    const latestVerification = verificationDates.length > 0 ? verificationDates[verificationDates.length - 1] : null

    return {
      count: filteredAndSortedItems.length,
      average,
      median,
      latestVerification,
    }
  }, [filteredAndSortedItems])

  const toggleFilterSection = (section: string) => {
    setExpandedFilters((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const activeFilters = useMemo(() => {
    const filters = []
    if (minScore > 0) filters.push({ key: "score", label: `Wynik indeksu: ${minScore}+`, value: minScore })
    if (advancedFilters.headquarters !== "any")
      filters.push({
        key: "hq",
        label: `Siedziba w PL: ${advancedFilters.headquarters === "yes" ? "Tak" : "Nie"}`,
        value: advancedFilters.headquarters,
      })
    if (advancedFilters.vatStatus !== "any")
      filters.push({
        key: "vat",
        label: `VAT czynny: ${advancedFilters.vatStatus === "yes" ? "Tak" : "Nie"}`,
        value: advancedFilters.vatStatus,
      })
    if (advancedFilters.bankAccount !== "any")
      filters.push({
        key: "bank",
        label: `Rachunek w PL: ${advancedFilters.bankAccount === "yes" ? "Tak" : "Nie"}`,
        value: advancedFilters.bankAccount,
      })
    if (advancedFilters.ageMin > 0 || advancedFilters.ageMax < 100)
      filters.push({
        key: "age",
        label: `Wiek: ${advancedFilters.ageMin}–${advancedFilters.ageMax} lat`,
        value: `${advancedFilters.ageMin}-${advancedFilters.ageMax}`,
      })
    return filters
  }, [minScore, advancedFilters])

  const clearFilter = (key: string) => {
    switch (key) {
      case "score":
        setMinScore(0)
        break
      case "hq":
        setAdvancedFilters((prev) => ({ ...prev, headquarters: "any" }))
        break
      case "vat":
        setAdvancedFilters((prev) => ({ ...prev, vatStatus: "any" }))
        break
      case "bank":
        setAdvancedFilters((prev) => ({ ...prev, bankAccount: "any" }))
        break
      case "age":
        setAdvancedFilters((prev) => ({ ...prev, ageMin: 0, ageMax: 100 }))
        break
    }
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setMinScore(0)
    setSortBy("score-desc")
    setAdvancedFilters({
      headquarters: "any",
      vatStatus: "any",
      bankAccount: "any",
      ageMin: 0,
      ageMax: 100,
    })
  }

  const FilterToggle = ({
    value,
    onChange,
    label,
  }: {
    value: FilterState
    onChange: (value: FilterState) => void
    label: string
  }) => (
    <div>
      <div className="text-sm text-slate-600 mb-2">{label}</div>
      <div className="flex rounded-lg border border-slate-300 overflow-hidden">
        {(["any", "yes", "no"] as FilterState[]).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              value === option
                ? "bg-red-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border-r border-slate-300 last:border-r-0"
            }`}
          >
            {option === "any" ? "Dowolnie" : option === "yes" ? "Tak" : "Nie"}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            showToast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {showToast.message}
        </div>
      )}

      <ComparisonPanel
        isOpen={showComparisonPanel}
        onClose={closeComparisonPanel}
        comparedCompanies={comparedCompanies}
        companies={category.items}
        onClear={clearComparison}
        categorySlug={category.slug}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-slate-600">
            <li>
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Strona główna
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4" />
            </li>
            <li>
              <Link href="/kategorie" className="hover:text-slate-900 transition-colors">
                Kategorie
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4" />
            </li>
            <li>
              <span className="text-slate-900 font-medium">{category.name}</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">{category.name}</h1>
          <p className="text-lg text-slate-600 mb-6">{category.short}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Liczba firm</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.count}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Średni wynik</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.average}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Mediana</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.median}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-600">Ostatnia aktualizacja</span>
              </div>
              <div className="text-sm font-medium text-slate-900">{metrics.latestVerification || "—"}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              {/* Polish Score Filter */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Wynik indeksu</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minScore}
                      onChange={(e) => setMinScore(Number.parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm font-medium w-16 text-center bg-slate-100 px-2 py-1 rounded">
                      {minScore}+
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMinScore(0)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-colors ${minScore === 0 ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Wszystkie
                    </button>
                    <button
                      onClick={() => setMinScore(67)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-colors ${minScore === 67 ? "bg-green-100 text-green-800" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                    >
                      Polskie (67+)
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-slate-200">
                <button
                  onClick={() => toggleFilterSection("advanced")}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <h3 className="font-semibold text-slate-900">
                    Filtry zaawansowane
                    {activeFilters.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-slate-600">({activeFilters.length})</span>
                    )}
                  </h3>
                  {expandedFilters.includes("advanced") ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                {expandedFilters.includes("advanced") && (
                  <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
                    <FilterToggle
                      value={advancedFilters.headquarters}
                      onChange={(value) => setAdvancedFilters((prev) => ({ ...prev, headquarters: value }))}
                      label="Siedziba w PL"
                    />
                    <FilterToggle
                      value={advancedFilters.vatStatus}
                      onChange={(value) => setAdvancedFilters((prev) => ({ ...prev, vatStatus: value }))}
                      label="VAT czynny"
                    />
                    <FilterToggle
                      value={advancedFilters.bankAccount}
                      onChange={(value) => setAdvancedFilters((prev) => ({ ...prev, bankAccount: value }))}
                      label="Rachunek w PL"
                    />
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Wiek działalności (lata)</div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={advancedFilters.ageMin}
                            onChange={(e) =>
                              setAdvancedFilters((prev) => ({ ...prev, ageMin: Number.parseInt(e.target.value) || 0 }))
                            }
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                            placeholder="Min"
                          />
                          <span className="text-slate-500 self-center">–</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={advancedFilters.ageMax}
                            onChange={(e) =>
                              setAdvancedFilters((prev) => ({
                                ...prev,
                                ageMax: Number.parseInt(e.target.value) || 100,
                              }))
                            }
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-sm text-slate-600 mb-3">Sortowanie</div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      >
                        <option value="score-desc">Indeks malejąco</option>
                        <option value="score-asc">Indeks rosnąco</option>
                        <option value="name-asc">Nazwa A–Z</option>
                        <option value="name-desc">Nazwa Z–A</option>
                        <option value="age-desc">Wiek malejąco</option>
                        <option value="age-asc">Wiek rosnąco</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Mobile Filter Button */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj w tej kategorii..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filtruj
                  {activeFilters.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                      {activeFilters.length}
                    </span>
                  )}
                </button>
              </div>

              {activeFilters.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-600">Aktywne filtry:</span>
                    {activeFilters.map((filter) => (
                      <div
                        key={filter.key}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                      >
                        <span>{filter.label}</span>
                        <button
                          onClick={() => clearFilter(filter.key)}
                          className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={clearAllFilters} className="text-sm text-slate-600 hover:text-slate-900 underline">
                      Wyczyść wszystko
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-600">
                  Wyników: <span className="font-medium">{metrics.count}</span>
                </div>
                <div className="hidden lg:block">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                  >
                    <option value="score-desc">Indeks malejąco</option>
                    <option value="score-asc">Indeks rosnąco</option>
                    <option value="name-asc">Nazwa A–Z</option>
                    <option value="name-desc">Nazwa Z–A</option>
                    <option value="age-desc">Wiek malejąco</option>
                    <option value="age-asc">Wiek rosnąco</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {filteredAndSortedItems.map((item, index) => {
                const polishComponents = getPolishIndexComponents(item)
                const isCompared = comparedCompanies.includes(item.id)

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 p-6"
                  >
                    <div className="flex items-start gap-6">
                      {/* Left: Logo and Company Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <CompanyLogo
                            id={item.id}
                            brandName={item.brand}
                            logoUrl={item.logoUrl}
                            logoDarkUrl={item.logoDarkUrl}
                            brandColor={item.brandColor}
                            size={48}
                            rounded={8}
                            priority={false}
                          />
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">{item.brand}</h3>
                            <p className="text-slate-600">{item.company}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          {Object.entries(polishComponents).map(([key, component]) => (
                            <div key={key} className="text-center">
                              <div className="text-xs text-slate-600 mb-1">{component.label}</div>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg">{component.status}</span>
                                {typeof component.status === "string" && component.status.includes("lat") && (
                                  <span className="text-xs text-slate-500">{component.status}</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{component.weight}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Score and Actions */}
                      <div className="flex flex-col items-end gap-4">
                        <div
                          className={`px-4 py-2 rounded-full text-white font-bold text-xl bg-gradient-to-r ${getScoreColor(item.score)}`}
                        >
                          {item.score}
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/firma/${item.id}`}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Zobacz profil
                          </Link>
                          <button
                            onClick={() => toggleCompare(item.id, item.brand)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                              isCompared
                                ? "bg-green-100 text-green-700 border border-green-200 animate-in zoom-in-95"
                                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {isCompared ? (
                              <>
                                <Check className="w-4 h-4" />
                                Dodano
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Porównaj
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Brak firm spełniających kryteria</h3>
                <p className="text-slate-600 mb-6">Spróbuj zmienić filtry lub wyszukiwane hasło</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Wyczyść filtry
                </button>
              </div>
            )}
          </div>
        </div>

        <ComparisonBar
          comparedCompanies={comparedCompanies}
          companies={category.items}
          onRemove={removeFromComparison}
          onClear={clearComparison}
          onCompare={openComparisonPanel}
        />

        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Filtry
                    {activeFilters.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-slate-600">({activeFilters.length})</span>
                    )}
                  </h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-slate-100 rounded-md">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Wynik indeksu</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number.parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium w-16 text-center bg-slate-100 px-2 py-1 rounded">
                        {minScore}+
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMinScore(0)}
                        className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                      >
                        Wszystkie
                      </button>
                      <button
                        onClick={() => setMinScore(67)}
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                      >
                        Polskie (67+)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <FilterToggle
                    value={advancedFilters.headquarters}
                    onChange={(value) => setAdvancedFilters((prev) => ({ ...prev, headquarters: value }))}
                    label="Siedziba w PL"
                  />
                  <FilterToggle
                    value={advancedFilters.vatStatus}
                    onChange={(value) => setAdvancedFilters((prev) => ({ ...prev, vatStatus: value }))}
                    label="VAT czynny"
                  />
                  <FilterToggle
                    value={advancedFilters.bankAccount}
                    onChange={(value) => setAdvancedFilters((prev) => ({ ...prev, bankAccount: value }))}
                    label="Rachunek w PL"
                  />
                  <div>
                    <div className="text-sm text-slate-600 mb-2">Wiek działalności (lata)</div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={advancedFilters.ageMin}
                        onChange={(e) =>
                          setAdvancedFilters((prev) => ({ ...prev, ageMin: Number.parseInt(e.target.value) || 0 }))
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                        placeholder="Min"
                      />
                      <span className="text-slate-500 self-center">–</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={advancedFilters.ageMax}
                        onChange={(e) =>
                          setAdvancedFilters((prev) => ({ ...prev, ageMax: Number.parseInt(e.target.value) || 100 }))
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                {activeFilters.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Wyczyść wszystkie filtry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
