"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, ChevronRight, Trash2, Home, Share2, Check, BookmarkX } from "lucide-react"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { CompanyLogo } from "@/components/company-logo"

interface BookmarkedCompany {
    id: string
    brand: string
    company: string
    category: string
    categorySlug: string
    website_url?: string
    country_code?: string
}

export default function BookmarksClient() {
    const { bookmarks, isLoaded, removeBookmark, clearAll } = useBookmarks()
    const [companies, setCompanies] = useState<BookmarkedCompany[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    // Fetch company data whenever bookmarks change
    useEffect(() => {
        if (!isLoaded) return

        if (bookmarks.length === 0) {
            setCompanies([])
            setLoading(false)
            return
        }

        async function fetchCompanies() {
            setLoading(true)
            try {
                const res = await fetch(`/api/companies/by-ids?ids=${bookmarks.join(",")}`)
                if (res.ok) {
                    const data = await res.json()
                    // Maintain bookmark order
                    const ordered = bookmarks
                        .map(id => data.find((c: BookmarkedCompany) => c.id === id))
                        .filter(Boolean) as BookmarkedCompany[]
                    setCompanies(ordered)
                }
            } catch (err) {
                console.error("Błąd ładowania ulubionych:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchCompanies()
    }, [bookmarks, isLoaded])

    const handleShare = async () => {
        const polishCompanies = companies.filter(c => c.country_code === "PL")
        const text = polishCompanies.length > 0
            ? `Moje polskie firmy (${polishCompanies.length}): ${polishCompanies.map(c => c.brand).join(", ")} — sprawdź na CzyPolskaFirma.pl`
            : `Moje ulubione firmy: ${companies.map(c => c.brand).join(", ")} — sprawdź na CzyPolskaFirma.pl`

        if (navigator.share) {
            try {
                await navigator.share({ title: "Moje ulubione firmy | CzyPolskaFirma", text })
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Initial loading state
    if (!isLoaded || loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 rounded w-48" />
                        <div className="h-4 bg-slate-200 rounded w-64" />
                        <div className="grid gap-3 mt-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-white rounded-xl border border-slate-200" />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
            {/* Breadcrumbs */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-14">
                        <nav className="flex items-center gap-1.5 text-sm">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">Start</span>
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-400">Ulubione</span>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-red-500 fill-current" />
                            </div>
                            Ulubione firmy
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            {companies.length > 0
                                ? `${companies.length} ${companies.length === 1 ? "firma" : companies.length < 5 ? "firmy" : "firm"} na Twojej liście`
                                : "Twoja osobista lista firm"}
                        </p>
                    </div>

                    {companies.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                {copied ? (
                                    <><Check className="w-4 h-4 text-green-600" /> Skopiowano!</>
                                ) : (
                                    <><Share2 className="w-4 h-4" /> Udostępnij listę</>
                                )}
                            </button>
                            <button
                                onClick={clearAll}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                title="Wyczyść wszystkie ulubione"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Wyczyść</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                {companies.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-slate-50 flex items-center justify-center">
                            <BookmarkX className="w-8 h-8 text-slate-300" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Nie masz jeszcze ulubionych firm
                        </h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 px-4">
                            Przeglądaj firmy i klikaj ikonę serduszka <Heart className="w-3.5 h-3.5 inline text-red-400" />, aby dodać je tutaj. Lista zapisuje się w Twojej przeglądarce.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm"
                        >
                            Przeglądaj firmy
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    /* Company List */
                    <div className="space-y-3">
                        {companies.map((company) => {
                            const isPolish = company.country_code === "PL"
                            return (
                                <div
                                    key={company.id}
                                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 p-4 flex items-center gap-4"
                                >
                                    <Link href={`/firma/${company.id}`} className="flex-shrink-0">
                                        <CompanyLogo
                                            websiteUrl={company.website_url}
                                            name={company.brand}
                                            size={48}
                                        />
                                    </Link>

                                    <Link href={`/firma/${company.id}`} className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-slate-900 uppercase tracking-wide text-sm group-hover:text-red-600 transition-colors truncate">
                                                {company.brand}
                                            </h3>
                                            {company.country_code && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${company.country_code.toLowerCase()}.png`}
                                                    alt={company.country_code}
                                                    className="w-5 h-auto rounded-[2px] border border-slate-200 flex-shrink-0"
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{company.company}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{company.category}</p>
                                    </Link>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => removeBookmark(company.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Usuń z ulubionych"
                                            aria-label="Usuń z ulubionych"
                                        >
                                            <Heart className="w-4 h-4 fill-current" />
                                        </button>
                                        <Link
                                            href={`/firma/${company.id}`}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Info Banner */}
                {companies.length > 0 && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs text-blue-700 text-center">
                            💡 Lista ulubionych jest zapisana w tej przeglądarce. Nie wymaga konta ani logowania.
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}
