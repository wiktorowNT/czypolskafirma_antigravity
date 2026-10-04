"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, Share2, Check } from "lucide-react"
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
    initialAlternatives?: Alternative[]
}

export default function PolishAlternatives({
    categorySlug,
    categoryName,
    companyId,
    isCurrentCompanyPolish,
    initialAlternatives,
}: PolishAlternativesProps) {
    // Dane przekazane z serwera renderują się w wyjściowym HTML (linki widoczne dla crawlera).
    const hasInitialData = initialAlternatives !== undefined
    const [alternatives, setAlternatives] = useState<Alternative[]>(initialAlternatives || [])
    const [isLoading, setIsLoading] = useState(!hasInitialData)
    const [shared, setShared] = useState(false)

    useEffect(() => {
        if (hasInitialData) return
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
    }, [categorySlug, companyId, hasInitialData])

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
            <div className="animate-pulse space-y-3">
                <div className="h-6 bg-warm rounded-full w-64" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-warm rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Udostępnianie */}
            <div className="flex items-center justify-between gap-4 border-[1.5px] border-line rounded-2xl px-5 py-4">
                <p className="text-[15px] font-semibold text-ink-2">Udostępnij profil tej firmy</p>
                <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border-[1.5px] border-line text-[15px] font-bold text-ink hover:border-ink transition-colors"
                >
                    {shared ? (
                        <>
                            <Check className="w-4 h-4" />
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

            {/* Firmy z tej samej kategorii / polskie alternatywy */}
            {alternatives.length > 0 && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3.5">
                        <div>
                            <h3 className="text-xl font-extrabold tracking-tight text-ink">
                                {alternatives.some((alt) => alt.country_code?.toUpperCase() !== "PL")
                                    ? `Inne firmy z kategorii ${categoryName}`
                                    : isCurrentCompanyPolish
                                        ? `Inne polskie firmy w kategorii ${categoryName}`
                                        : `Polskie alternatywy w kategorii ${categoryName}`
                                }
                            </h3>
                            {!isCurrentCompanyPolish && (
                                <p className="text-[15px] text-ink-2 mt-1">
                                    Wesprzyj polską gospodarkę — sprawdź rodzime marki w tej samej kategorii.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {alternatives.map((alt) => {
                            const isPl = alt.country_code?.toUpperCase() === "PL"
                            return (
                                <Link
                                    key={alt.id}
                                    href={`/firma/${encodeURIComponent(alt.slug || alt.id)}`}
                                    className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line px-3.5 py-3 hover:border-ink transition-colors"
                                >
                                    <CompanyLogo websiteUrl={alt.website_url} name={alt.brand} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-bold text-ink truncate">{alt.brand}</p>
                                        <span className="text-[12.5px] font-semibold text-ink-2 flex items-center gap-1.5">
                                            {alt.country_code && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${alt.country_code.toLowerCase()}.png`}
                                                    alt=""
                                                    width={14}
                                                    height={10}
                                                    className="rounded-[2px]"
                                                />
                                            )}
                                            {isPl ? "Polska firma" : "Firma zagraniczna"}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors flex-shrink-0" />
                                </Link>
                            )
                        })}
                    </div>

                    <div className="mt-4">
                        <Link
                            href={`/kategoria/${categorySlug}`}
                            className="text-[15px] font-bold text-brand-ink hover:underline underline-offset-4 inline-flex items-center gap-1"
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
