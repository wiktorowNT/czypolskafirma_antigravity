"use client"

import Link from "next/link"
import { ChevronRight, Globe, BadgeCheck, MapPin, Receipt, Heart } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import { useBookmarks } from "@/hooks/use-bookmarks"

export interface CompanyCardProps {
    id: string
    brand: string
    logoUrl?: string
    websiteUrl?: string
    countryCode?: string
    isPolish: boolean
    headquartersInPL?: boolean
    vatActive?: boolean
}

export function CompanyCard({
    id,
    brand,
    logoUrl,
    websiteUrl,
    countryCode,
    isPolish,
    headquartersInPL,
    vatActive,
}: CompanyCardProps) {
    const profileUrl = `/firma/${id}`
    const { isBookmarked, toggleBookmark } = useBookmarks()
    const bookmarked = isBookmarked(id)

    return (
        <div className="group h-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200 py-5 px-5 flex items-center gap-3">
            {/* Logo - Clickable */}
            <Link href={profileUrl} className="flex-shrink-0 cursor-pointer">
                <CompanyLogo
                    websiteUrl={websiteUrl}
                    logoUrl={logoUrl}
                    name={brand}
                    size={52}
                />
            </Link>

            {/* Main Content - Clickable */}
            <Link href={profileUrl} className="flex-1 min-w-0 flex flex-col justify-center gap-1 cursor-pointer">
                {/* Company Name - UPPERCASE, bold, high contrast, 2-line clamp */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide line-clamp-2 min-h-[2.75rem] group-hover:text-red-600 transition-colors leading-tight">
                    {brand}
                </h3>

                {/* Status Text - Subtle, smaller */}
                {isPolish ? (
                    <span className="text-xs text-slate-600 flex items-center gap-1.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-red-600" />
                        Polska firma
                    </span>
                ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        Zagraniczna firma
                    </span>
                )}

                {/* Badges */}
                {(headquartersInPL !== undefined || vatActive !== undefined) && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {headquartersInPL !== undefined && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${headquartersInPL
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-slate-50 text-slate-400 border border-slate-200"
                                }`}>
                                <MapPin className="w-2.5 h-2.5" />
                                HQ PL
                            </span>
                        )}
                        {vatActive !== undefined && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${vatActive
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-slate-50 text-slate-400 border border-slate-200"
                                }`}>
                                <Receipt className="w-2.5 h-2.5" />
                                VAT
                            </span>
                        )}
                    </div>
                )}
            </Link>

            {/* Right Side - Bookmark + Flag + Arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Bookmark Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        toggleBookmark(id)
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                        bookmarked
                            ? "text-red-500 bg-red-50 hover:bg-red-100"
                            : "text-slate-300 hover:text-red-400 hover:bg-red-50"
                    }`}
                    title={bookmarked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                    aria-label={bookmarked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                >
                    <Heart className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                </button>

                {/* Country Flag */}
                {countryCode && (
                    <div className="flex items-center justify-center" title={countryCode}>
                        <img
                            src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
                            alt={countryCode}
                            className="w-8 h-auto rounded-[2px] border border-slate-200 shadow-sm"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* Arrow Link */}
                <Link
                    href={profileUrl}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}
