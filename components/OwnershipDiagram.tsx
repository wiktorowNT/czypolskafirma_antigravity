import { Network, ArrowDown, Building2, User, Store } from "lucide-react"
import { getCountryName } from "@/lib/company-faq"
import { CompanyLogo } from "@/components/company-logo"

export interface DiagramBrand {
    name: string
    /** Domena strony marki (np. tymbark.com) — źródło logotypu. */
    domain?: string
}

interface OwnershipDiagramProps {
    brandName: string
    companyName: string
    parentCompanyName?: string
    ownerName?: string
    countryCode?: string
    /** Marki należące do firmy (kolumna brand_aliases) — fallback tekstowy. */
    brandAliases?: string[]
    /** Marki z domenami (kolumna brands) — wyświetlane z logotypami. */
    brands?: DiagramBrand[]
}

function CountryFlag({ code, className }: { code: string; className?: string }) {
    return (
        <img
            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
            alt={getCountryName(code) || code}
            className={className || "w-5 h-auto rounded-[2px] border border-slate-200"}
        />
    )
}

/**
 * Wizualna piramida właścicielska: ostateczny właściciel -> spółka-matka -> marka.
 * Renderuje się tylko, gdy znamy przynajmniej ostatecznego właściciela
 * albo spółkę-matkę (inaczej diagram nie wnosi nic ponad hero).
 */
export default function OwnershipDiagram({
    brandName,
    companyName,
    parentCompanyName,
    ownerName,
    countryCode,
    brandAliases,
    brands,
}: OwnershipDiagramProps) {
    const hasBrands = Boolean(brands && brands.length > 0)
    const hasAliases = Boolean(brandAliases && brandAliases.length > 0)
    if (!ownerName && !parentCompanyName && !hasBrands && !hasAliases) return null

    const isPolish = countryCode?.toUpperCase() === "PL"
    const countryName = countryCode ? getCountryName(countryCode) : null

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Network className="w-4 h-4 text-slate-600" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Struktura właścicielska</h2>
            </div>

            {(ownerName || parentCompanyName) && (
            <div className="flex flex-col items-center gap-1">
                {/* Szczyt piramidy: ostateczny właściciel */}
                {ownerName && (
                    <>
                        <div
                            className={`w-full sm:w-4/5 rounded-xl border-2 p-4 text-center ${
                                isPolish ? "border-red-200 bg-red-50/50" : "border-slate-300 bg-slate-50"
                            }`}
                        >
                            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                                <User className="w-3.5 h-3.5" />
                                Ostateczny właściciel
                            </div>
                            <div className="font-bold text-slate-900 text-sm sm:text-base">{ownerName}</div>
                            {countryCode && (
                                <div className="flex items-center justify-center gap-2 mt-1.5 text-sm text-slate-600">
                                    <CountryFlag code={countryCode} />
                                    {countryName || countryCode}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center text-slate-400 py-0.5">
                            <span className="text-[11px]">kontroluje</span>
                            <ArrowDown className="w-4 h-4" />
                        </div>
                    </>
                )}

                {/* Środek: spółka-matka (jeśli inna niż marka) */}
                {parentCompanyName && (
                    <>
                        <div className="w-full sm:w-4/5 rounded-xl border border-slate-200 bg-white p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                Spółka-matka
                            </div>
                            <div className="font-semibold text-slate-800 text-sm sm:text-base">{parentCompanyName}</div>
                        </div>
                        <div className="flex flex-col items-center text-slate-400 py-0.5">
                            <span className="text-[11px]">posiada</span>
                            <ArrowDown className="w-4 h-4" />
                        </div>
                    </>
                )}

                {/* Podstawa: marka działająca w Polsce */}
                <div className="w-full sm:w-4/5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        <Store className="w-3.5 h-3.5" />
                        Marka na polskim rynku
                    </div>
                    <div className="font-semibold text-slate-800 text-sm sm:text-base">{brandName}</div>
                    {companyName && companyName !== brandName && (
                        <div className="text-xs text-slate-500 mt-1">{companyName}</div>
                    )}
                </div>
            </div>
            )}

            {/* Marki należące do firmy: karty z logotypami (brands), fallback
                na pigułki tekstowe (brand_aliases). */}
            {(hasBrands || hasAliases) && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2.5">
                        Marki należące do firmy
                    </div>
                    {hasBrands ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {brands!.map((b) => (
                                <div
                                    key={b.name}
                                    className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                                >
                                    <CompanyLogo
                                        websiteUrl={b.domain ? `https://${b.domain}` : undefined}
                                        name={b.name}
                                        size={32}
                                        className="rounded-lg flex-shrink-0"
                                    />
                                    <span className="text-sm font-medium text-slate-800 truncate">{b.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {brandAliases!.map((alias) => (
                                <span
                                    key={alias}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                                >
                                    {alias}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}
