import type { ReactNode } from "react"
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

function Flag({ code }: { code: string }) {
    return (
        <img
            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
            alt={getCountryName(code) || code}
            width={18}
            height={13}
            className="rounded-[3px] flex-shrink-0"
        />
    )
}

function Node({
    label,
    title,
    sub,
    right,
    tone = "plain",
}: {
    label: string
    title: string
    sub?: string
    right?: ReactNode
    tone?: "plain" | "owner-pl" | "owner-foreign"
}) {
    const toneClass =
        tone === "owner-pl"
            ? "border-brand bg-brand-soft"
            : tone === "owner-foreign"
                ? "border-graphite bg-card"
                : "border-line bg-card"
    const labelClass = tone === "owner-pl" ? "text-brand-ink" : tone === "owner-foreign" ? "text-ink" : "text-ink-3"
    return (
        <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center rounded-2xl border-[1.5px] px-4 py-3 ${toneClass}`}>
            <div className="min-w-0">
                <div className={`text-[11px] font-extrabold uppercase tracking-[0.06em] ${labelClass}`}>{label}</div>
                <div className="text-base font-bold text-ink break-words">{title}</div>
                {sub && <div className="text-[13px] font-semibold text-ink-2 mt-0.5 break-words">{sub}</div>}
            </div>
            {right}
        </div>
    )
}

function Connector({ text }: { text: string }) {
    return (
        <div className="relative h-7 ml-6 border-l-2 border-dashed border-ink-3" aria-hidden="true">
            <span className="absolute left-3 top-1 text-xs font-bold text-ink-2">{text}</span>
        </div>
    )
}

/**
 * Ścieżka kapitału: ostateczny właściciel -> spółka-matka -> marka.
 * Renderuje się tylko, gdy znamy przynajmniej ostatecznego właściciela,
 * spółkę-matkę albo marki należące do firmy.
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
        <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Struktura właścicielska</h2>
            <p className="text-[15px] text-ink-2 mt-1 mb-4">
                Ścieżka kapitału: od ostatecznego właściciela do marki, którą znasz ze sklepu.
            </p>

            {(ownerName || parentCompanyName) && (
                <div className="bg-warm rounded-3xl p-3 sm:p-4">
                    {ownerName && (
                        <>
                            <Node
                                label="Ostateczny właściciel"
                                title={ownerName}
                                tone={isPolish ? "owner-pl" : "owner-foreign"}
                                right={
                                    countryCode ? (
                                        <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                                            <Flag code={countryCode} />
                                            <span className="hidden sm:inline">{countryName || countryCode}</span>
                                            <span className="sm:hidden">{countryCode.toUpperCase()}</span>
                                        </span>
                                    ) : null
                                }
                            />
                            <Connector text="kontroluje" />
                        </>
                    )}

                    {parentCompanyName && (
                        <>
                            <Node label="Spółka-matka" title={parentCompanyName} />
                            <Connector text="posiada" />
                        </>
                    )}

                    <Node
                        label="Marka na polskim rynku"
                        title={brandName}
                        sub={companyName && companyName !== brandName ? companyName : undefined}
                    />
                </div>
            )}

            {/* Marki należące do firmy: logotypy (brands), fallback na pigułki (brand_aliases) */}
            {(hasBrands || hasAliases) && (
                <div className="mt-5">
                    <div className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mb-2.5">
                        Marki należące do firmy
                    </div>
                    {hasBrands ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {brands!.map((b) => (
                                <div
                                    key={b.name}
                                    className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-line px-2 py-3 text-center min-w-0"
                                >
                                    <CompanyLogo
                                        websiteUrl={b.domain ? `https://${b.domain}` : undefined}
                                        name={b.name}
                                        size={44}
                                    />
                                    <span className="text-[13.5px] font-bold text-ink w-full truncate">{b.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {brandAliases!.map((alias) => (
                                <span
                                    key={alias}
                                    className="inline-flex items-center h-8 px-3.5 rounded-full border-[1.5px] border-line text-[13.5px] font-bold text-ink"
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
