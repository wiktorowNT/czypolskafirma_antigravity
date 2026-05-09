"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BadgeCheck, ChevronRight, Share2, Check } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"

interface Alternative {
    id: string
    slug: string
    brand: string
    website_url?: string
    country_code?: string
}

interface PolishAlternativesProps {
    categorySlug: string
    categoryName: string
    companyId: string
    isCurrentCompanyPolish: boolean
}

export default function PolishAlternatives({
    categorySlug,
    categoryName,
    companyId,
    isCurrentCompanyPolish,
}: PolishAlternativesProps) {
    const [alternatives, setAlternatives] = useState<Alternative[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [shared, setShared] = useState(false)

    useEffect(() => {
        async function fetchAlternatives() {
            try {
                const res = await fetch(
                    `/api/companies/alternatives?category=${encodeURIComponent(categorySlug)}&exclude=${companyId}&limit=6`
                )
                if (res.ok) {
                    const data = await res.json()
                    setAlternatives(data)
                }
            } catch (err) {
                console.error("Błąd ładowania alternatyw:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAlternatives()
    }, [categorySlug, companyId])

    const handleShare = async () => {
        const url = window.location.href
        const title = document.title

        if (navigator.share) {
            try {
                await navigator.share({ title, url })
            } catch {
                // User cancelled share
            }
        } else {
            await navigator.clipboard.writeText(url)
            setShared(true)
            setTimeout(() => setShared(false), 2000)
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-slate-200 rounded w-48" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Share Button */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Udostępnij profil tej firmy</p>
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        {shared ? (
                            <>
                                <Check className="w-4 h-4 text-green-600" />
                                Skopiowano link!
                            </>
                        ) : (
                            <>
                                <Share2 className="w-4 h-4" />
                                Udostępnij
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Polish Alternatives */}
            {alternatives.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <BadgeCheck className="w-5 h-5 text-red-600" />
                            {isCurrentCompanyPolish
                                ? `Inne polskie firmy w kategorii ${categoryName}`
                                : `Polskie alternatywy w kategorii ${categoryName}`
                            }
                        </h3>
                        {!isCurrentCompanyPolish && (
                            <p className="text-sm text-slate-500 mt-1">
                                Wesprzyj polską gospodarkę — sprawdź rodzime marki w tej samej kategorii.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {alternatives.map((alt) => (
                            <Link
                                key={alt.id}
                                href={`/firma/${alt.slug || alt.id}`}
                                className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all"
                            >
                                <CompanyLogo
                                    websiteUrl={alt.website_url}
                                    name={alt.brand}
                                    size={40}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-red-600 transition-colors">
                                        {alt.brand}
                                    </p>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <BadgeCheck className="w-3 h-3 text-red-600" />
                                        Polska firma
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                            </Link>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <Link
                            href={`/kategoria/${categorySlug}`}
                            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1"
                        >
                            Pokaż wszystkie firmy w kategorii {categoryName}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
