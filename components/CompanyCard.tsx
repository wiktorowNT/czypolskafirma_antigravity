"use client"

import Link from "next/link"
import { ChevronRight, Globe, BadgeCheck, MapPin, Receipt, Heart } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import { useBookmarks } from "@/hooks/use-bookmarks"

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

    return (
        <div className="group bg-white rounded-full border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300 p-2 pr-5 flex items-center gap-3 md:gap-4 relative overflow-hidden">
            {/* Logo - Clickable */}
            <Link href={profileUrl} className="flex-shrink-0 cursor-pointer relative z-10">
                <div className="bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                    <CompanyLogo
                        websiteUrl={websiteUrl}
                        logoUrl={logoUrl}
                        name={brand}
                        size={48}
                        className="rounded-full"
                    />
                </div>
            </Link>

            {/* Main Content - Clickable */}
            <Link href={profileUrl} className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer relative z-10 py-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] md:text-[15px] font-bold text-slate-900 uppercase tracking-wide truncate group-hover:text-red-600 transition-colors">
                        {brand}
                    </h3>
                    {isPolish && (
                        <div className="hidden sm:flex items-center justify-center w-4 h-4 rounded-full bg-red-50" title="Polska firma">
                            <BadgeCheck className="w-3 h-3 text-red-600" />
                        </div>
                    )}
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {/* Status Text - Subtle, smaller */}
                    {isPolish ? (
                        <span className="sm:hidden text-[10px] text-red-600 font-medium">Polska</span>
                    ) : (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            Zagraniczna
                        </span>
                    )}

                    {(headquartersInPL !== undefined || vatActive !== undefined) && (
                        <div className="flex items-center gap-1">
                            {headquartersInPL && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    HQ PL
                                </span>
                            )}
                            {vatActive && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    VAT
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>

            {/* Right Side - Bookmark + Flag */}
            <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                {/* Country Flag */}
                {countryCode && (
                    <div className="flex items-center justify-center" title={countryCode}>
                        <img
                            src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
                            alt={countryCode}
                            className="w-6 sm:w-7 h-auto rounded-sm border border-slate-200 shadow-sm"
                            loading="lazy"
                        />
                    </div>
                )}
                
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
            </div>
            
            {/* Hover background effect (optional subtle indicator) */}
            <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 rounded-full" />
        </div>
    )
}
