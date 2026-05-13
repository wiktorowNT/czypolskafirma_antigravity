"use client"

import { useEffect, useState, useRef } from "react"
import { Building2, AlertCircle, ArrowUpDown, Globe } from "lucide-react"
import { CompanyGrid, CompanyGridItem } from "@/components/CompanyGrid"
import { countryNames } from "@/lib/countries"

const SCROLL_KEY = "companies-list-scroll"

export function CompaniesList() {
  const [companies, setCompanies] = useState<CompanyGridItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("name-asc")
  const [countryQuery, setCountryQuery] = useState<string>("")
  const hasRestoredScroll = useRef(false)

  // Save scroll position before navigating away
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
    }

    // Save on any click (catches link navigations)
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a")
      if (link && link.href && !link.href.startsWith("#")) {
        saveScroll()
      }
    }

    document.addEventListener("click", handleClick, true)
    window.addEventListener("beforeunload", saveScroll)

    return () => {
      document.removeEventListener("click", handleClick, true)
      window.removeEventListener("beforeunload", saveScroll)
    }
  }, [])

  useEffect(() => {
    // Manual sync to avoid Suspense issues
    const params = new URLSearchParams(window.location.search)
    const country = params.get("country")
    if (country) setCountryQuery(country)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    async function fetchCompanies() {
      try {
        console.log("Fetching companies via API...")
        const response = await fetch("/api/companies", { signal: controller.signal })
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        console.log("API response items:", data.length)

        const formattedData: CompanyGridItem[] = data.map((c: any) => ({
          id: c.id,
          slug: c.slug,
          brand: c.slug ? c.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : c.name,
          company: c.name,
          description: "",
          logo_url: null,
          country_code: c.country_code,
          polish_index: 0,
          vatActive: c.vat_czynny === true || c.vat_czynny === "Tak",
          website_url: c.website_url,
          headquartersInPL: c.siedziba_pl === true || c.siedziba_pl === "Tak"
        }))
        setCompanies(formattedData)
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error("Fetch companies timed out")
          setError("Przekroczono czas oczekiwania na dane")
        } else {
          console.error("Error fetching companies:", err)
          setError("Nie udało się pobrać listy firm")
        }
      } finally {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    fetchCompanies()
    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  // Restore scroll position after data has loaded
  useEffect(() => {
    if (!loading && companies.length > 0 && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true
      const savedScroll = sessionStorage.getItem(SCROLL_KEY)
      if (savedScroll) {
        // Wait for the DOM to render the full list before scrolling
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, parseInt(savedScroll, 10))
            sessionStorage.removeItem(SCROLL_KEY)
          })
        })
      }
    }
  }, [loading, companies])

  const filteredCompanies = companies.filter(company => {
    const query = countryQuery.toLowerCase().trim()
    if (!query) return true
    const countryName = countryNames[company.country_code || ""]?.toLowerCase() || ""
    const countryCode = company.country_code?.toLowerCase() || ""
    return countryName.includes(query) || countryCode === query
  })

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case "name-asc": return a.brand.localeCompare(b.brand)
      case "name-desc": return b.brand.localeCompare(a.brand)
      case "polish-first":
        if (a.country_code === "PL" && b.country_code !== "PL") return -1
        if (a.country_code !== "PL" && b.country_code === "PL") return 1
        return a.brand.localeCompare(b.brand)
      case "foreign-first":
        if (a.country_code !== "PL" && b.country_code === "PL") return -1
        if (a.country_code === "PL" && b.country_code !== "PL") return 1
        return a.brand.localeCompare(b.brand)
      default: return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Błąd</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Wszystkie firmy</h1>
            <p className="text-slate-600">
              Przeglądaj pełną bazę firm i marek dostępnych w serwisie ({companies.length})
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative group flex-1 sm:min-w-[240px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Globe className="w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Filtruj wg kraju (np. Niemcy)..."
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="name-asc">Nazwa (A-Z)</option>
                <option value="name-desc">Nazwa (Z-A)</option>
                <option value="polish-first">Najpierw polskie</option>
                <option value="foreign-first">Najpierw zagraniczne</option>
              </select>
            </div>
          </div>
        </div>
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Brak firm spełniających kryteria</h3>
            <p className="text-slate-600">Spróbuj zmienić filtry lub wyszukać inną nazwę</p>
          </div>
        ) : (
          <CompanyGrid companies={sortedCompanies} />
        )}
      </div>
    </div>
  )
}
