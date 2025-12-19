"use client"

import { BadgeCheck, Network, Calendar, Globe, MapPin } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"

// Country code to name mapping
const countryNames: Record<string, string> = {
    PL: "Polska",
    FR: "Francja",
    DE: "Niemcy",
    US: "USA",
    NL: "Holandia",
    GB: "Wielka Brytania",
    UK: "Wielka Brytania",
    SE: "Szwecja",
    DK: "Dania",
    ES: "Hiszpania",
    IT: "Włochy",
    JP: "Japonia",
    CH: "Szwajcaria",
    AT: "Austria",
    BE: "Belgia",
    LU: "Luksemburg",
    IE: "Irlandia",
    PT: "Portugalia",
    CZ: "Czechy",
    SK: "Słowacja",
    HU: "Węgry",
}

interface CompanyHeroProps {
    id: string
    name: string
    slug: string
    description?: string | null
    country_code?: string | null
    founded_at?: string | null
    parent_company_name?: string | null
    owner_name?: string | null
    ownership_type?: string | null
    categoryName?: string | null
    website_url?: string | null
}

// Get country name from code
function getCountryName(code?: string | null): string {
    if (!code) return "Brak danych"
    return countryNames[code.toUpperCase()] || code.toUpperCase()
}

// Get founding year
function getFoundingYear(foundedAt?: string | null): number | null {
    if (!foundedAt) return null
    try {
        return new Date(foundedAt).getFullYear()
    } catch {
        return null
    }
}

// Format slug as display name
function formatSlugAsName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

export default function CompanyHero({
    id,
    name,
    slug,
    description,
    country_code,
    founded_at,
    parent_company_name,
    owner_name,
    ownership_type,
    categoryName,
    website_url
}: CompanyHeroProps) {
    const isPolish = country_code?.toUpperCase() === "PL"
    const countryName = getCountryName(country_code)
    const foundingYear = getFoundingYear(founded_at)
    const displayName = formatSlugAsName(slug)

    // Owner display logic - narrative approach
    const ownerDisplay = owner_name || parent_company_name || "Brak danych"

    // Owner label - narrative style
    const getOwnerLabel = () => {
        if (ownership_type === "Spółka Córka") {
            return "Spółka córka należąca do:"
        } else if (ownership_type === "Wspólnik" || ownership_type === "Udziałowiec") {
            return "Główny udziałowiec:"
        }
        return "Właściciel / Inwestor:"
    }

    const ownerLabel = getOwnerLabel()

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            {/* Section 1: Identity */}
            <div className="p-6 sm:p-8">
                <div className="flex items-start gap-6">
                    {/* Logo - using universal CompanyLogo component */}
                    <CompanyLogo
                        websiteUrl={website_url}
                        name={displayName}
                        size={96}
                        priority
                    />

                    {/* Header Content */}
                    <div className="flex-1 min-w-0">
                        {/* Name + Flag + Badge Row */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            {/* Country Flag */}
                            {country_code && (
                                <img
                                    src={`https://flagcdn.com/w80/${country_code.toLowerCase()}.png`}
                                    alt={`Flaga ${countryName}`}
                                    className="h-9 w-auto rounded-sm border border-slate-200 shadow-sm"
                                />
                            )}

                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-wide">
                                {displayName}
                            </h1>

                            {/* Status Badge */}
                            {isPolish ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-full">
                                    <BadgeCheck className="w-4 h-4" />
                                    Polska Firma
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-slate-600 bg-slate-100 rounded-full">
                                    <Globe className="w-3.5 h-3.5" />
                                    Firma Zagraniczna
                                </span>
                            )}
                        </div>

                        {/* Legal Name */}
                        <p className="text-sm text-slate-500 mb-3">
                            {name}
                        </p>

                        {/* Category Badge */}
                        {categoryName && (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-md">
                                {categoryName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <p className="mt-5 text-slate-600 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            {/* Section 2: Insights (Bottom) */}
            <div className="border-t border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    {/* Column 1: Kapitał */}
                    <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Pochodzenie kapitału
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                {countryName}
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Właściciel */}
                    <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <Network className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-500 tracking-wide">
                                {ownerLabel}
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5 whitespace-normal break-words leading-snug line-clamp-2">
                                {ownerDisplay}
                            </p>
                        </div>
                    </div>

                    {/* Column 3: Historia */}
                    <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                W Polsce
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                {foundingYear ? `Od ${foundingYear} roku` : "Brak danych"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
