"use client"

import Link from "next/link"
import { ChevronRight, Globe } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"

export interface CompanyCardProps {
    id: string
    brand: string
    logoUrl?: string
    websiteUrl?: string
    countryCode?: string
    isPolish: boolean
}

export function CompanyCard({
    id,
    brand,
    logoUrl,
    websiteUrl,
    countryCode,
    isPolish,
}: CompanyCardProps) {
    const profileUrl = `/firma/${id}`

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
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        Polska firma
                    </span>
                ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        Zagraniczna firma
                    </span>
                )}
            </Link>

            {/* Right Side - Flag + Arrow only */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Country Flag */}
                {countryCode && (
                    <div className="flex items-center justify-center" title={countryCode}>
                        <img
                            src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
                            alt={countryCode}
                            className="w-8 h-auto rounded shadow-sm opacity-90"
                            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
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
