"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { countryNames } from "@/lib/countries"

export interface CompanyCardProps {
    id: string
    slug?: string
    brand: string
    logoUrl?: string
    websiteUrl?: string
    countryCode?: string
    isPolish: boolean
    headquartersInPL?: boolean
    vatActive?: boolean
}

/**
 * Wiersz firmy na listach (kategoria, wyszukiwarka, ulubione).
 * System „Półka”: obramowanie 1,5 px, bez cieni; status tekstem, nie metką —
 * metki zostają dla werdyktu na profilu, żeby lista nie była czerwoną ścianą.
 */
export function CompanyCard({
    id,
    slug,
    brand,
    logoUrl,
    websiteUrl,
    countryCode,
    isPolish,
    headquartersInPL,
    vatActive,
}: CompanyCardProps) {
    const profileUrl = `/firma/${slug || id}`
    const { isBookmarked, toggleBookmark } = useBookmarks()
    const bookmarked = isBookmarked(id)
    const code = countryCode?.toUpperCase()
    const countryName = code ? countryNames[code] || code : null

    return (
        <div className="group relative flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-card pl-2.5 pr-2 py-2.5 hover:border-ink transition-colors">
            <Link href={profileUrl} className="flex-shrink-0" tabIndex={-1} aria-hidden="true">
                <CompanyLogo websiteUrl={websiteUrl} logoUrl={logoUrl} name={brand} size={44} />
            </Link>

            <Link href={profileUrl} className="flex-1 min-w-0 after:absolute after:inset-0 after:rounded-2xl">
                <h3 className="text-[15.5px] font-bold text-ink truncate">{brand}</h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold ${isPolish ? "text-brand-ink" : "text-ink-2"}`}>
                        {code && (
                            <img
                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                alt={`Flaga: ${countryName} — kraj pochodzenia kapitału`}
                                width={16}
                                height={12}
                                className="rounded-[2px]"
                                loading="lazy"
                            />
                        )}
                        {isPolish ? "Polska firma" : "Zagraniczna"}
                    </span>
                    {headquartersInPL && (
                        <span className="inline-flex items-center h-5 px-2 rounded-full bg-warm text-[10.5px] font-bold text-ink-2">HQ PL</span>
                    )}
                    {vatActive && (
                        <span className="inline-flex items-center h-5 px-2 rounded-full bg-warm text-[10.5px] font-bold text-ink-2">VAT</span>
                    )}
                </div>
            </Link>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(id)
                }}
                className={`relative z-10 w-9 h-9 flex-shrink-0 grid place-items-center rounded-full transition-colors ${
                    bookmarked ? "text-brand bg-brand-soft" : "text-ink-3 hover:text-ink hover:bg-warm"
                }`}
                title={bookmarked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                aria-label={bookmarked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
            >
                <Heart className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
            </button>
        </div>
    )
}
