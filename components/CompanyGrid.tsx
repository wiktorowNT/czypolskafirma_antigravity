"use client"

import Link from "next/link"
import { CompanyCard } from "@/components/CompanyCard"
import { Search } from "lucide-react"

export interface CompanyGridItem {
    id: string
    brand: string
    logoUrl?: string
    website_url?: string
    country_code?: string
}

export interface CompanyGridProps {
    companies: CompanyGridItem[]
    categoryName?: string
    searchTerm?: string
    onClearFilters?: () => void
}

export function CompanyGrid({
    companies,
    categoryName,
    searchTerm,
    onClearFilters,
}: CompanyGridProps) {
    if (companies.length === 0) {
        return (
            <div className="text-center py-12 md:py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                <div className="bg-slate-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">
                    Brak wyników w tej kategorii
                </h3>
                <p className="text-sm md:text-base text-slate-500 mb-6 max-w-sm mx-auto px-4">
                    Nie znaleźliśmy tej firmy w kategorii{" "}
                    <strong className="text-slate-700">{categoryName || "tej"}</strong>.
                    Firma może istnieć w innej kategorii.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
                    <Link
                        href={searchTerm ? `/?q=${encodeURIComponent(searchTerm)}` : "/"}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm text-center"
                    >
                        Szukaj w całej bazie
                    </Link>
                    {onClearFilters && (
                        <button
                            onClick={onClearFilters}
                            className="w-full sm:w-auto px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                        >
                            Wyczyść filtry
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map((company) => {
                const isPolish = company.country_code === "PL"

                return (
                    <CompanyCard
                        key={company.id}
                        id={company.id}
                        brand={company.brand}
                        logoUrl={company.logoUrl}
                        websiteUrl={company.website_url}
                        countryCode={company.country_code}
                        isPolish={isPolish}
                    />
                )
            })}
        </div>
    )
}
