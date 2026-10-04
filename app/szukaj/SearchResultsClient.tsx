"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, Loader2, Check, FolderOpen, MessageSquarePlus, ChevronDown, Filter, X } from "lucide-react"
import { getCategoryIcon } from "@/components/category-icon"
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
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    const [sidebarCategories, setSidebarCategories] = useState<{ id: string, name: string, slug: string, icon?: string }[]>([])

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories")
                if (res.ok) {
                    const data = await res.json()
                    setSidebarCategories(data)
                }
            } catch (err) {
                console.error("Błąd ładowania kategorii:", err)
            }
        }
        fetchCategories()
    }, [])

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
        <div className="min-h-screen bg-warm">
            <div className="container mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink mb-6 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Powrót do strony głównej
                </Link>

                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2">
                        {query ? (
                            <>Wyniki wyszukiwania dla: "<span className="text-brand-ink">{query}</span>"</>
                        ) : (
                            "Wpisz nazwę firmy"
                        )}
                    </h1>
                    {!isLoading && query && (
                        <p className="text-sm text-ink-3">
                            Znaleziono <strong className="text-ink">{metrics.total}</strong> wyników
                            {metrics.polishCount > 0 && (
                                <> • <strong className="text-ink">{metrics.polishCount}</strong> polskich</>
                            )}
                            {metrics.foreignCount > 0 && (
                                <> • <strong className="text-ink-2">{metrics.foreignCount}</strong> zagranicznych</>
                            )}
                        </p>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* Capital Type Filter */}
                            <div className="bg-white rounded-xl border border-line p-5">
                                <h3 className="font-semibold text-ink text-sm mb-4">Rodzaj kapitału</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.polish ? "bg-ink border-ink" : "bg-white border-line group-hover:border-ink-3"
                                            }`}>
                                            {capitalFilter.polish && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={capitalFilter.polish}
                                            onChange={(e) => setCapitalFilter(prev => ({ ...prev, polish: e.target.checked }))}
                                        />
                                        <span className="text-sm text-ink-2 group-hover:text-ink transition-colors">Polska firma</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.foreign ? "bg-ink border-ink" : "bg-white border-line group-hover:border-ink-3"
                                            }`}>
                                            {capitalFilter.foreign && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={capitalFilter.foreign}
                                            onChange={(e) => setCapitalFilter(prev => ({ ...prev, foreign: e.target.checked }))}
                                        />
                                        <span className="text-sm text-ink-2 group-hover:text-ink transition-colors">Zagraniczna firma</span>
                                    </label>
                                </div>
                            </div>

                            {/* Browse Categories */}
                            {sidebarCategories.length > 0 && (
                                <div className="bg-white rounded-xl border border-line p-5">
                                    <h3 className="font-semibold text-ink text-sm mb-4">Przeglądaj kategorie</h3>
                                    <div className="space-y-2">
                                        {sidebarCategories.map((cat) => {
                                            const Icon = cat.icon ? getCategoryIcon(cat.icon) : FolderOpen
                                            return (
                                                <Link
                                                    key={cat.slug}
                                                    href={`/kategoria/${cat.slug}`}
                                                    className="flex items-center gap-3 p-2 rounded-lg text-ink-2 hover:text-ink hover:bg-warm transition-colors group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-warm flex items-center justify-center text-ink-3 group-hover:text-ink group-hover:bg-warm transition-colors">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium">{cat.name}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Missing Company CTA */}
                            <div className="bg-warm rounded-xl border border-line p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-warm-2 flex items-center justify-center text-ink">
                                        <MessageSquarePlus className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-ink text-sm">Nie widzisz firmy?</h3>
                                </div>
                                <p className="text-sm text-ink-2 mb-4 leading-relaxed">
                                    Pomóż nam budować największą bazę polskich firm. Zgłoś brakującą markę.
                                </p>
                                <ReportDialog>
                                    <button
                                        className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-line text-ink text-sm font-medium rounded-lg hover:bg-warm hover:border-line transition-all"
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
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-3 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Szukaj firmy..."
                                        className="w-full pl-11 pr-4 py-4 bg-white border border-line rounded-xl text-base outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-ink-3"
                                    />
                                </form>

                                <div className="flex items-center gap-3 self-end md:self-auto">
                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="appearance-none pl-4 pr-10 py-4 bg-white border border-line rounded-xl text-base font-medium text-ink-2 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer min-w-[180px]"
                                        >
                                            <option value="name-asc">Sortuj: Nazwa A-Z</option>
                                            <option value="name-desc">Sortuj: Nazwa Z-A</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-3 w-4 h-4 pointer-events-none" />
                                    </div>

                                    <button
                                        onClick={() => setShowMobileFilters(true)}
                                        className="lg:hidden px-4 py-4 bg-white border border-line rounded-xl text-ink-2 hover:bg-warm transition-colors"
                                    >
                                        <Filter className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-ink-3 animate-spin" />
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
                            <div className="text-center py-20 bg-white rounded-2xl border border-line border-dashed">
                                <div className="bg-warm w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-ink-3" />
                                </div>
                                <h3 className="text-lg font-semibold text-ink mb-2">
                                    Wpisz frazę do wyszukania
                                </h3>
                                <p className="text-ink-3 max-w-sm mx-auto">
                                    Użyj pola wyszukiwania powyżej, aby znaleźć firmę w naszej bazie.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Filters Drawer */}
                {showMobileFilters && (
                    <div className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm">
                        <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
                            <div className="p-5 border-b border-line flex items-center justify-between sticky top-0 bg-white z-10">
                                <h2 className="text-lg font-bold text-ink">Filtry</h2>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="p-2 hover:bg-warm rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-ink-3" />
                                </button>
                            </div>
                            <div className="p-5 space-y-8">
                                <div>
                                    <h3 className="font-semibold text-ink text-sm mb-4">Rodzaj kapitału</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.polish ? "bg-ink border-ink" : "bg-white border-line"}`}>
                                                {capitalFilter.polish && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={capitalFilter.polish}
                                                onChange={(e) => setCapitalFilter(prev => ({ ...prev, polish: e.target.checked }))}
                                            />
                                            <span className="text-sm text-ink-2">Polska firma</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${capitalFilter.foreign ? "bg-ink border-ink" : "bg-white border-line"}`}>
                                                {capitalFilter.foreign && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={capitalFilter.foreign}
                                                onChange={(e) => setCapitalFilter(prev => ({ ...prev, foreign: e.target.checked }))}
                                            />
                                            <span className="text-sm text-ink-2">Zagraniczna firma</span>
                                        </label>
                                    </div>
                                </div>

                                {sidebarCategories.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-ink text-sm mb-4">Przeglądaj kategorie</h3>
                                        <div className="space-y-2">
                                            {sidebarCategories.map((cat) => (
                                                <Link
                                                    key={cat.slug}
                                                    href={`/kategoria/${cat.slug}`}
                                                    className="flex items-center gap-3 p-2 rounded-lg text-ink-2 hover:text-ink hover:bg-warm transition-colors"
                                                    onClick={() => setShowMobileFilters(false)}
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{cat.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-line sticky bottom-0 bg-white">
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full py-3 bg-ink text-white rounded-xl font-medium hover:bg-black transition-colors"
                                >
                                    Pokaż wyniki ({filteredAndSortedResults.length})
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
