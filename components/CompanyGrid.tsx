"use client"

import Link from "next/link"
import { CompanyCard } from "@/components/CompanyCard"
import { Search } from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"

export interface CompanyGridItem {
    id: string
    slug?: string
    brand: string
    logoUrl?: string
    website_url?: string
    country_code?: string
    headquartersInPL?: boolean
    vatActive?: boolean
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
            <div className="text-center py-12 md:py-20 bg-warm rounded-[24px]">
                <div className="bg-card w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 md:w-8 md:h-8 text-ink-3" />
                </div>
                <h3 className="text-base md:text-lg font-extrabold text-ink mb-2">
                    {categoryName ? "Brak wyników w tej kategorii" : "Brak wyników"}
                </h3>
                <p className="text-sm md:text-base text-ink-3 mb-6 max-w-sm mx-auto px-4">
                    {categoryName ? (
                        <>
                            Nie znaleźliśmy tej firmy w kategorii <strong className="text-ink-2">{categoryName}</strong>. Firma może istnieć w innej kategorii.
                        </>
                    ) : (
                        "Nie znaleźliśmy tej firmy w naszej bazie. Sprawdź pisownię lub zgłoś ją do dodania."
                    )}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
                    {categoryName && (
                        <Link
                            href={searchTerm ? `/szukaj?q=${encodeURIComponent(searchTerm)}` : "/szukaj"}
                            className="w-full sm:w-auto h-11 inline-flex items-center justify-center px-6 bg-panel text-white rounded-full hover:bg-black transition-colors font-bold text-sm text-center"
                        >
                            Szukaj w całej bazie
                        </Link>
                    )}
                    <ReportDialog defaultBrandName={searchTerm || ""}>
                        <button className="w-full sm:w-auto h-11 px-6 bg-card text-ink border-[1.5px] border-line rounded-full hover:border-ink transition-colors font-bold text-sm text-center">
                            Zgłoś firmę
                        </button>
                    </ReportDialog>
                    {onClearFilters && (
                        <button
                            onClick={onClearFilters}
                            className="w-full sm:w-auto h-11 px-6 bg-card text-ink-2 border-[1.5px] border-line rounded-full hover:border-ink transition-colors font-bold text-sm"
                        >
                            Wyczyść filtry
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {companies.map((company) => {
                const isPolish = company.country_code === "PL"

                return (
                    <CompanyCard
                        key={company.id}
                        id={company.id}
                        slug={company.slug}
                        brand={company.brand}
                        logoUrl={company.logoUrl}
                        websiteUrl={company.website_url}
                        countryCode={company.country_code}
                        isPolish={isPolish}
                        headquartersInPL={company.headquartersInPL}
                        vatActive={company.vatActive}
                    />
                )
            })}
        </div>
    )
}
