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
  Scale,
  FolderOpen,
  MessageSquarePlus,
} from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import ComparisonPanel from "@/components/comparison-panel"
import { ReportDialog } from "@/components/report-dialog"
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
  country_code?: string
  website_url?: string
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



function getCountryFlag(countryCode?: string) {
  if (!countryCode) return "🏳️" // Fallback flag
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function CategoryPageView({ category }: CategoryPageViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name-asc")
  const [capitalFilter, setCapitalFilter] = useState<{ polish: boolean; foreign: boolean }>({
    polish: searchParams.get("capital") === "polish" || searchParams.get("capital") === "all" || false,
    foreign: searchParams.get("capital") === "foreign" || searchParams.get("capital") === "all" || false,
  })
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
    if (sortBy !== "name-asc") params.set("sort", sortBy)

    if (capitalFilter.polish && capitalFilter.foreign) params.set("capital", "all")
    else if (capitalFilter.polish) params.set("capital", "polish")
    else if (capitalFilter.foreign) params.set("capital", "foreign")

    if (advancedFilters.headquarters !== "any") params.set("hq", advancedFilters.headquarters)
    if (advancedFilters.vatStatus !== "any") params.set("vat", advancedFilters.vatStatus)
    if (advancedFilters.bankAccount !== "any") params.set("bank", advancedFilters.bankAccount)
    if (advancedFilters.ageMin > 0) params.set("ageMin", advancedFilters.ageMin.toString())
    if (advancedFilters.ageMax < 100) params.set("ageMax", advancedFilters.ageMax.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : ""
    if (newUrl !== window.location.search) {
      router.replace(`${window.location.pathname}${newUrl}`, { scroll: false })
    }
  }, [searchTerm, sortBy, capitalFilter, advancedFilters, router])

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

      const isPolish = item.country_code === "PL"
      if (capitalFilter.polish && !capitalFilter.foreign && !isPolish) return false
      if (!capitalFilter.polish && capitalFilter.foreign && isPolish) return false
      // If both are true or both are false (default state or clear), show all
      // Actually, if both are false, we usually show all. Let's make sure "both false" means "all" effectively, or "none"?
      // Usually filters are additive or restrictive. 
      // User requirement: checkboxes. If I uncheck both, should I see nothing? 
      // Typically if nothing is selected, everything is shown OR nothing is shown. 
      // Let's assume: unchecked = don't filter by this. But wait, if they are checkboxes "Polski", "Zagraniczny", usually:
      // - [ ] Polski -> Show polish
      // - [ ] Zagraniczny -> Show foreign
      // - [x] Polski, [ ] Zagraniczny -> Show Polish only
      // - [x] Polski, [x] Zagraniczny -> Show Both
      // - [ ] Polski, [ ] Zagraniczny -> Show All (default) OR Show None? 
      // Let's go with "Show All" if both unchecked for better UX, or treat them as toggles.
      // Logic above:
      // If polish=T, foreign=F -> Show Polish (hide foreign)
      // If polish=F, foreign=T -> Show Foreign (hide polish)
      // If polish=T, foreign=T -> Show All
      // If polish=F, foreign=F -> Show All

      // Wait, the logic: "if (capitalFilter.polish && !capitalFilter.foreign && !isPolish) return false" covers "Only Polish toggled".
      // "if (!capitalFilter.polish && capitalFilter.foreign && isPolish) return false" covers "Only Foreign toggled".
      // If both T: first line false (foreign is T), second line false (polish is T) -> Returns true (Show). Correct.
      // If both F: first line false (polish is F), second line false (foreign is F) -> Returns true (Show). Correct.

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
          return a.brand.localeCompare(b.brand)
      }
    })

    return filtered
  }, [category.items, searchTerm, sortBy, capitalFilter, advancedFilters])

  const metrics = useMemo(() => {
    // Polish threshold: country_code === 'PL'
    const polishCount = filteredAndSortedItems.filter(item => item.country_code === "PL").length
    const foreignCount = filteredAndSortedItems.length - polishCount

    // Get latest verification date
    const verificationDates = filteredAndSortedItems
      .map((item) => companyDetailsData[item.id as keyof typeof companyDetailsData]?.lastVerified)
      .filter(Boolean)
      .sort()
    const latestVerification = verificationDates.length > 0 ? verificationDates[verificationDates.length - 1] : null

    return {
      count: filteredAndSortedItems.length,
      polishCount,
      foreignCount,
      latestVerification,
    }
  }, [filteredAndSortedItems])

  const toggleFilterSection = (section: string) => {
    setExpandedFilters((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const activeFilters = useMemo(() => {
    const filters = []
    if (capitalFilter.polish && !capitalFilter.foreign) filters.push({ key: "capital_pl", label: "Polska firma", value: "pl" })
    if (!capitalFilter.polish && capitalFilter.foreign) filters.push({ key: "capital_for", label: "Zagraniczna firma", value: "for" })

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
  }, [capitalFilter, advancedFilters])

  const clearFilter = (key: string) => {
    switch (key) {
      case "capital_pl":
      case "capital_for":
        setCapitalFilter({ polish: false, foreign: false })
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
    setCapitalFilter({ polish: false, foreign: false })
    setSortBy("name-asc")
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
    <div className="mb-4">
      <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>
      <div className="flex bg-slate-100 p-1 rounded-lg">
        {(["any", "yes", "no"] as FilterState[]).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${value === option
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {option === "any" ? "Dowolnie" : option === "yes" ? "Tak" : "Nie"}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-top-2 duration-200 ${showToast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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
          <ol className="flex items-center space-x-2 text-sm text-slate-500">
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

        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{category.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-sm md:text-base">
            <span>W bazie: <strong className="text-slate-900">{metrics.count}</strong> firm</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Polskie: <strong className="text-green-600">{metrics.polishCount}</strong></span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Zagraniczne: <strong className="text-slate-900">{metrics.foreignCount}</strong></span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">


              {/* Capital Type Filter */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Rodzaj kapitału</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.polish ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300 group-hover:border-slate-400"
                      }`}>
                      {capitalFilter.polish && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={capitalFilter.polish}
                      onChange={(e) => setCapitalFilter(prev => ({ ...prev, polish: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Polska firma</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.foreign ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300 group-hover:border-slate-400"
                      }`}>
                      {capitalFilter.foreign && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={capitalFilter.foreign}
                      onChange={(e) => setCapitalFilter(prev => ({ ...prev, foreign: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Zagraniczna firma</span>
                  </label>
                </div>
              </div>

              {/* Other Categories */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Inne kategorie</h3>
                <div className="space-y-2">
                  {[
                    { name: "Bankowość", slug: "bankowosc" },
                    { name: "IT & Technologie", slug: "it" },
                    { name: "Handel", slug: "handel" },
                    { name: "Energetyka", slug: "energetyka" },
                    { name: "Transport", slug: "transport" },
                  ].map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/kategorie/${cat.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Missing Company CTA */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">Nie widzisz firmy?</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Pomóż nam budować największą bazę polskich firm. Zgłoś brakującą markę.
                </p>
                <ReportDialog>
                  <button
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                  >
                    Zgłoś firmę
                  </button>
                </ReportDialog>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort Header */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Szukaj firmy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-base outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-md placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-md min-w-[180px]"
                    >
                      <option value="name-asc">Sortuj: Nazwa A-Z</option>
                      <option value="name-desc">Sortuj: Nazwa Z-A</option>
                      <option value="age-desc">Najstarsze firmy</option>
                      <option value="age-asc">Najmłodsze firmy</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden px-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-md"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs font-medium text-slate-500 self-center mr-1">Aktywne filtry:</span>
                {activeFilters.map((filter) => (
                  <div
                    key={filter.key}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm"
                  >
                    <span>{filter.label}</span>
                    <button
                      onClick={() => clearFilter(filter.key)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 ml-2"
                >
                  Wyczyść
                </button>
              </div>
            )}

            {/* Company Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAndSortedItems.map((item) => {
                const polishComponents = getPolishIndexComponents(item)
                const isCompared = comparedCompanies.includes(item.id)
                const isPolish = item.country_code === "PL"

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 py-5 px-5 flex items-center gap-5"
                  >
                    {/* Logo - Fixed width */}
                    <div className="flex-shrink-0">
                      <CompanyLogo
                        websiteUrl={item.website_url}
                        logoUrl={item.logoUrl}
                        name={item.brand}
                        size={52}
                      />
                    </div>

                    {/* Main Content - Vertical Stack */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                      <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
                        {item.brand}
                      </h3>

                      {/* Status Text (Subtle) */}
                      {isPolish ? (
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1.5">
                          Polska firma
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          Zagraniczna firma
                        </span>
                      )}
                    </div>

                    {/* Right Side - Aligned Right */}
                    <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 ml-auto">
                      {/* Country Flag */}
                      {item.country_code ? (
                        <div className="flex flex-col items-center justify-center" title={item.country_code}>
                          <img
                            src={`https://flagcdn.com/w80/${item.country_code.toLowerCase()}.png`}
                            alt={item.country_code}
                            className="w-8 h-auto rounded shadow-sm opacity-90"
                            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                            loading="lazy"
                          />
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCompare(item.id, item.brand);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${isCompared
                            ? "bg-green-100 text-green-700"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          title={isCompared ? "Usuń z porównania" : "Dodaj do porównania"}
                        >
                          {isCompared ? <Check className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                        </button>

                        <Link
                          href={`/firma/${item.id}`}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Brak wyników</h3>
                <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                  Nie znaleźliśmy firm spełniających Twoje kryteria. Spróbuj zmienić filtry.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                  Wyczyść wszystkie filtry
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
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm">
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-lg font-bold text-slate-900">Filtry</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-5 space-y-8">
                {/* Mobile filters content - reusing the same logic as desktop sidebar */}
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-4">Rodzaj kapitału</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.polish ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                        }`}>
                        {capitalFilter.polish && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={capitalFilter.polish}
                        onChange={(e) => setCapitalFilter(prev => ({ ...prev, polish: e.target.checked }))}
                      />
                      <span className="text-sm text-slate-600">Polska firma</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.foreign ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                        }`}>
                        {capitalFilter.foreign && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={capitalFilter.foreign}
                        onChange={(e) => setCapitalFilter(prev => ({ ...prev, foreign: e.target.checked }))}
                      />
                      <span className="text-sm text-slate-600">Zagraniczna firma</span>
                    </label>
                  </div>
                </div>


                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-4">Szczegóły</h3>
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
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  Pokaż wyniki ({filteredAndSortedItems.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}
