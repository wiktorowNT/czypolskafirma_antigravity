"use client"

import { useEffect, useRef } from "react"
import {
    Home,
    ChevronRight,
    Flag,
    Heart
} from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"
import CompanyHero from "@/components/CompanyHero"
import CompanyMetaDetails from "@/components/CompanyMetaDetails"
import OwnershipDiagram from "@/components/OwnershipDiagram"
import PolishAlternatives from "@/components/PolishAlternatives"
import CompanyFAQ from "@/components/CompanyFAQ"
import CompanyArticle from "@/components/CompanyArticle"
import Link from "next/link"
import { useBookmarks } from "@/hooks/use-bookmarks"

interface CompanyDetail {
    id: string
    name: string
    slug: string
    canonicalSlug: string
    brandName: string
    categorySlug: string
    categoryName: string
    nip?: string
    krs?: string
    siedziba_pl: boolean
    vat_czynny: boolean
    founded_at?: string
    age: number
    adres?: string
    owner_name?: string
    parent_company_name?: string
    ownership_type?: string
    business_description?: string
    ownership_description?: string
    logoUrl?: string
    country_code?: string
    website_url?: string
    registry_url?: string
    lastVerified: string
    brandAliases?: string[]
    brands?: { name: string; domain?: string }[]
    brandLinks?: Record<string, string>
}

interface RelatedCompany {
    id: string
    slug: string
    brand: string
    website_url?: string
    country_code?: string
}

interface CompanyProfileClientProps {
    company: CompanyDetail
    relatedCompanies?: RelatedCompany[]
}

// Format slug as display name: "polkomtel-plus" -> "Polkomtel Plus"
function formatSlugAsName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

export default function CompanyProfileClient({ company, relatedCompanies }: CompanyProfileClientProps) {
    const { isBookmarked, toggleBookmark } = useBookmarks()
    const bookmarked = isBookmarked(company.id)

    // Track company page view (fire-and-forget)
    const viewTracked = useRef(false)
    useEffect(() => {
        if (viewTracked.current) return
        viewTracked.current = true

        fetch("/api/companies/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId: company.id }),
        }).catch(() => {
            // Silently ignore tracking errors
        })
    }, [company.id])
    return (
        <main className="min-h-screen bg-background">
            {/* Okruszki + ulubione + data weryfikacji */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between gap-3 pt-4 sm:pt-5">
                    <nav className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2 min-w-0">
                        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink flex-shrink-0">
                            <Home className="w-4 h-4" />
                            <span className="hidden sm:inline">Start</span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" />
                        <Link
                            href={`/kategoria/${company.categorySlug}`}
                            className="hover:text-ink flex-shrink-0"
                        >
                            {formatSlugAsName(company.categorySlug)}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" />
                        <span className="text-ink truncate max-w-[120px] sm:max-w-[260px]">
                            {company.brandName || formatSlugAsName(company.slug)}
                        </span>
                    </nav>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="hidden sm:inline text-[12.5px] font-semibold text-ink-3 tabular-nums">
                            Weryfikacja: {company.lastVerified}
                        </span>
                        <button
                            onClick={() => toggleBookmark(company.id)}
                            className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-bold rounded-full border-[1.5px] transition-colors ${
                                bookmarked
                                    ? "text-brand-ink bg-brand-soft border-brand/40"
                                    : "text-ink border-line hover:border-ink"
                            }`}
                            title={bookmarked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                        >
                            <Heart className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
                            {bookmarked ? "W ulubionych" : "Ulubione"}
                        </button>
                    </div>
                </div>
                <p className="sm:hidden mt-2 text-[12.5px] font-semibold text-ink-3 tabular-nums">
                    Weryfikacja: {company.lastVerified}
                </p>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-14 space-y-12">

                {/* Company Hero - Identity, Status & Insights */}
                <CompanyHero
                    id={company.id}
                    name={company.name}
                    slug={company.slug}
                    brandName={company.brandName}
                    business_description={company.business_description}
                    ownership_description={company.ownership_description}
                    country_code={company.country_code}
                    founded_at={company.founded_at}
                    parent_company_name={company.parent_company_name}
                    owner_name={company.owner_name}
                    ownership_type={company.ownership_type}
                    categoryName={company.categoryName}
                    website_url={company.website_url}
                />

                {/* Struktura właścicielska — piramida marka -> spółka-matka -> właściciel */}
                <OwnershipDiagram
                    brandName={company.brandName}
                    companyName={company.name}
                    parentCompanyName={company.parent_company_name}
                    ownerName={company.owner_name}
                    countryCode={company.country_code}
                    brandAliases={company.brandAliases}
                    brands={company.brands}
                    brandLinks={company.brandLinks}
                />

                {/* Company Meta Details - Address, Registry, Links */}
                <CompanyMetaDetails
                    adres={company.adres}
                    nip={company.nip}
                    krs={company.krs}
                    website_url={company.website_url}
                    registry_url={company.registry_url}
                />

                {/* Polish Alternatives + Share */}
                <PolishAlternatives
                    categorySlug={company.categorySlug}
                    categoryName={company.categoryName}
                    companyId={company.id}
                    isCurrentCompanyPolish={company.country_code?.toUpperCase() === "PL"}
                    initialAlternatives={relatedCompanies}
                />

                {/* Zgłoś uwagi */}
                <div className="bg-warm rounded-3xl px-5 py-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-[15.5px] font-bold text-ink">Widzisz błąd lub masz więcej informacji?</p>
                        <p className="text-sm text-ink-2 mt-0.5">Pomóż nam poprawić dane o tej firmie.</p>
                    </div>
                    <ReportDialog defaultBrandName={company.brandName || formatSlugAsName(company.slug)}>
                        <button className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-card border-[1.5px] border-line text-[15px] font-bold text-ink hover:border-ink transition-colors">
                            <Flag className="w-4 h-4" />
                            Zgłoś uwagi
                        </button>
                    </ReportDialog>
                </div>

                {/* SEO Content — subtle bottom sections for Google indexing */}
                <CompanyFAQ
                    slug={company.slug}
                    brandName={company.brandName}
                    country_code={company.country_code}
                    ownership_description={company.ownership_description}
                    owner_name={company.owner_name}
                    parent_company_name={company.parent_company_name}
                    business_description={company.business_description}
                    categoryName={company.categoryName}
                    adres={company.adres}
                    siedziba_pl={company.siedziba_pl}
                    founded_at={company.founded_at}
                    age={company.age}
                />

                <CompanyArticle
                    slug={company.slug}
                    brandName={company.brandName}
                    country_code={company.country_code}
                    ownership_description={company.ownership_description}
                    owner_name={company.owner_name}
                    parent_company_name={company.parent_company_name}
                    business_description={company.business_description}
                    categoryName={company.categoryName}
                    adres={company.adres}
                    siedziba_pl={company.siedziba_pl}
                    founded_at={company.founded_at}
                    age={company.age}
                    ownership_type={company.ownership_type}
                />

            </div>
        </main>
    )
}

