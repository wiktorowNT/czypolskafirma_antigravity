"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, Loader2, Check, FolderOpen, MessageSquarePlus, ChevronDown } from "lucide-react"
import { CompanyCard } from "@/components/CompanyCard"
import { CompanyGrid } from "@/components/CompanyGrid"
import { ReportDialog } from "@/components/report-dialog"

interface SearchResult {
    id: string
    brand: string
    company: string
    category: string
    categorySlug: string
    website_url?: string
    country_code?: string
}

export default function SearchResultsClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get("q") || ""

    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(query)
    const [capitalFilter, setCapitalFilter] = useState({ polish: false, foreign: false })
    const [sortBy, setSortBy] = useState("name-asc")

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([])
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            try {
                const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&limit=100`)
                if (response.ok) {
                    const data = await response.json()
                    setResults(data)
                } else {
                    setResults([])
                }
            } catch (error) {
                console.error("Search error:", error)
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchResults()
    }, [query])

    // Filter and sort results
    const filteredAndSortedResults = useMemo(() => {
        let filtered = [...results]

        // Apply capital filter
        if (capitalFilter.polish && !capitalFilter.foreign) {
            filtered = filtered.filter(c => c.country_code === "PL")
        } else if (capitalFilter.foreign && !capitalFilter.polish) {
            filtered = filtered.filter(c => c.country_code !== "PL")
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return a.brand.localeCompare(b.brand, "pl")
                case "name-desc":
                    return b.brand.localeCompare(a.brand, "pl")
                default:
                    return 0
            }
        })

        return filtered
    }, [results, capitalFilter, sortBy])

    // Calculate metrics
    const metrics = useMemo(() => {
        const polishCount = results.filter(c => c.country_code === "PL").length
        const foreignCount = results.length - polishCount
        return { total: results.length, polishCount, foreignCount }
    }, [results])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchTerm.trim()) {
            router.push(`/szukaj?q=${encodeURIComponent(searchTerm.trim())}`)
        }
    }

    const clearFilters = () => {
        setCapitalFilter({ polish: false, foreign: false })
        setSearchTerm("")
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Powrót do strony głównej
                </Link>

                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        {query ? (
                            <>Wyniki wyszukiwania dla: "<span className="text-red-600">{query}</span>"</>
                        ) : (
                            "Wpisz nazwę firmy"
                        )}
                    </h1>
                    {!isLoading && query && (
                        <p className="text-sm text-slate-500">
                            Znaleziono <strong className="text-slate-900">{metrics.total}</strong> wyników
                            {metrics.polishCount > 0 && (
                                <> • <strong className="text-green-600">{metrics.polishCount}</strong> polskich</>
                            )}
                            {metrics.foreignCount > 0 && (
                                <> • <strong className="text-slate-700">{metrics.foreignCount}</strong> zagranicznych</>
                            )}
                        </p>
                    )}
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

                            {/* Browse Categories */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="font-semibold text-slate-900 text-sm mb-4">Przeglądaj kategorie</h3>
                                <div className="space-y-2">
                                    {[
                                        { name: "Budownictwo", slug: "budownictwo" },
                                        { name: "Bankowość", slug: "bankowosc" },
                                        { name: "IT & Technologie", slug: "it" },
                                        { name: "Handel", slug: "handel" },
                                        { name: "Energetyka", slug: "energetyka" },
                                    ].map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            href={`/kategoria/${cat.slug}`}
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
                                <form onSubmit={handleSearch} className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Szukaj firmy..."
                                        className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-base outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-md placeholder:text-slate-400"
                                    />
                                </form>

                                <div className="flex items-center gap-3 self-end md:self-auto">
                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="appearance-none pl-4 pr-10 py-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-md min-w-[180px]"
                                        >
                                            <option value="name-asc">Sortuj: Nazwa A-Z</option>
                                            <option value="name-desc">Sortuj: Nazwa Z-A</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                            </div>
                        )}

                        {/* Results Grid */}
                        {!isLoading && query && (
                            <CompanyGrid
                                companies={filteredAndSortedResults.map(r => ({
                                    id: r.id,
                                    brand: r.brand,
                                    website_url: r.website_url,
                                    country_code: r.country_code
                                }))}
                                searchTerm={searchTerm}
                                onClearFilters={clearFilters}
                            />
                        )}

                        {/* No Query State */}
                        {!isLoading && !query && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Wpisz frazę do wyszukania
                                </h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    Użyj pola wyszukiwania powyżej, aby znaleźć firmę w naszej bazie.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
