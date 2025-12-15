"use client"

import {
    Home,
    ChevronRight,
    Flag
} from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"
import CompanyHero from "@/components/CompanyHero"
import CompanyMetaDetails from "@/components/CompanyMetaDetails"
import Link from "next/link"

interface CompanyDetail {
    id: string
    name: string
    slug: string
    categorySlug: string
    categoryName: string
    nip?: string
    krs?: string
    siedziba_pl: boolean
    vat_czynny: boolean
    rachunek_pl: boolean
    founded_at?: string
    age: number
    adres?: string
    owner_name?: string
    parent_company_name?: string
    ownership_type?: string
    notes?: string
    description?: string
    logoUrl?: string
    country_code?: string
    website_url?: string
    registry_url?: string
    lastVerified: string
}

interface CompanyProfileClientProps {
    company: CompanyDetail
}

// Format slug as display name: "polkomtel-plus" -> "Polkomtel Plus"
function formatSlugAsName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

export default function CompanyProfileClient({ company }: CompanyProfileClientProps) {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
            {/* Top Navigation - Breadcrumbs */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14 overflow-x-auto">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-1.5 text-sm min-w-0">
                            {/* Home */}
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors hover:underline flex-shrink-0"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">Start</span>
                            </Link>

                            {/* Separator */}
                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />

                            {/* Category */}
                            <Link
                                href={`/kategoria/${company.categorySlug}`}
                                className="text-slate-600 hover:text-slate-900 transition-colors hover:underline flex-shrink-0"
                            >
                                {formatSlugAsName(company.categorySlug)}
                            </Link>

                            {/* Separator */}
                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />

                            {/* Current Page - Company Name */}
                            <span className="text-slate-400 truncate max-w-[150px] sm:max-w-[250px]">
                                {formatSlugAsName(company.slug)}
                            </span>
                        </nav>

                        {/* Verification Date */}
                        <p className="text-xs text-slate-400 flex-shrink-0 ml-4">
                            Weryfikacja: {company.lastVerified}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">

                {/* Company Hero - Identity, Status & Insights */}
                <CompanyHero
                    id={company.id}
                    name={company.name}
                    slug={company.slug}
                    description={company.description}
                    country_code={company.country_code}
                    founded_at={company.founded_at}
                    parent_company_name={company.parent_company_name}
                    owner_name={company.owner_name}
                    ownership_type={company.ownership_type}
                    categoryName={company.categoryName}
                    website_url={company.website_url}
                />

                {/* Company Meta Details - Address, Registry, Links */}
                <CompanyMetaDetails
                    adres={company.adres}
                    nip={company.nip}
                    krs={company.krs}
                    website_url={company.website_url}
                    registry_url={company.registry_url}
                />

                {/* Report CTA */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Widzisz błąd lub masz więcej informacji?</p>
                            <p className="text-xs text-slate-500 mt-0.5">Pomóż nam poprawić dane o tej firmie.</p>
                        </div>
                        <ReportDialog defaultBrandName={formatSlugAsName(company.slug)}>
                            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                <Flag className="w-4 h-4" />
                                Zgłoś uwagi
                            </button>
                        </ReportDialog>
                    </div>
                </div>

            </div>
        </main >
    )
}
