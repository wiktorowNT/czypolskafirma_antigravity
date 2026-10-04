"use client"

import { CompanyLogo } from "@/components/company-logo"
import { VerdictTag } from "@/components/verdict-tag"
import { getCountryName } from "@/lib/company-faq"

interface CompanyHeroProps {
    id: string
    name: string
    slug: string
    brandName?: string
    business_description?: string | null
    ownership_description?: string | null
    country_code?: string | null
    founded_at?: string | null
    parent_company_name?: string | null
    owner_name?: string | null
    ownership_type?: string | null
    categoryName?: string | null
    website_url?: string | null
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

function Paragraphs({ text }: { text: string }) {
    return (
        <div className="text-[15.5px] text-ink-2 leading-relaxed space-y-2.5">
            {text.split('\n').filter(p => p.trim()).map((para, i) => (
                <p key={i}>{para.trim()}</p>
            ))}
        </div>
    )
}

export default function CompanyHero({
    name,
    slug,
    brandName,
    business_description,
    ownership_description,
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
    const displayName = brandName || formatSlugAsName(slug)

    const ownerDisplay = owner_name || parent_company_name || "Brak danych"

    const getOwnerLabel = () => {
        if (ownership_type === "Spółka Córka") {
            return "Spółka córka należąca do:"
        } else if (ownership_type === "Wspólnik" || ownership_type === "Udziałowiec") {
            return "Główny udziałowiec:"
        }
        return "Właściciel / Inwestor:"
    }

    const facts: { label: string; value: string; flag?: boolean }[] = [
        { label: "Pochodzenie kapitału", value: countryName, flag: true },
        { label: getOwnerLabel(), value: ownerDisplay },
        { label: "W Polsce", value: foundingYear ? `Od ${foundingYear} roku` : "Brak danych" },
    ]

    return (
        <div className="space-y-5">
            {/* Tożsamość: logo, nazwa, spółka, kategoria, metka */}
            <div className="grid grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[72px_minmax(0,1fr)_auto] gap-x-4 sm:gap-x-5 gap-y-4 items-center">
                <CompanyLogo
                    websiteUrl={website_url}
                    name={displayName}
                    size={72}
                    priority
                />
                <div className="min-w-0">
                    <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight leading-[1.1] text-ink break-words">
                        {displayName}
                    </h1>
                    <p className="text-sm font-semibold text-ink-2 mt-1.5 break-words">
                        {name}
                    </p>
                    {categoryName && (
                        <span className="inline-flex items-center h-7 px-3 mt-2.5 rounded-full bg-warm text-[12.5px] font-bold text-ink-2">
                            {categoryName}
                        </span>
                    )}
                </div>
                <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
                    <VerdictTag countryCode={country_code} size="lg" />
                </div>
            </div>

            {/* Werdykt — odpowiedź dla Google i dla czytelnika */}
            <section className="bg-warm rounded-3xl px-5 py-5 sm:px-7 sm:py-6">
                <h2 className="text-[12.5px] font-extrabold text-ink-2 uppercase tracking-[0.06em] mb-2">
                    Werdykt: Czy {displayName} to polska firma?
                </h2>
                <p className="text-2xl sm:text-[30px] font-extrabold tracking-tight leading-tight text-ink">
                    {displayName} to{" "}
                    {isPolish ? (
                        <span className="text-brand">polska firma</span>
                    ) : (
                        <span>firma zagraniczna</span>
                    )}
                    .
                </p>
                <p className="mt-2 text-[15.5px] font-medium text-ink-2">
                    Kraj pochodzenia: <strong className="text-ink font-bold">{countryName}</strong>
                </p>
            </section>

            {/* Fakty */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {facts.map((f) => (
                    <div key={f.label} className="border-[1.5px] border-line rounded-2xl px-4 py-3 min-w-0">
                        <dt className="text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.06em]">{f.label}</dt>
                        <dd className="mt-1 text-[15px] font-bold text-ink flex items-center gap-2">
                            {f.flag && country_code && (
                                <img
                                    src={`https://flagcdn.com/w40/${country_code.toLowerCase()}.png`}
                                    alt=""
                                    width={18}
                                    height={13}
                                    className="rounded-[3px] flex-shrink-0"
                                />
                            )}
                            <span className="line-clamp-2 break-words">{f.value}</span>
                        </dd>
                    </div>
                ))}
            </dl>

            {/* Opisy */}
            {(ownership_description || business_description) && (
                <div className="space-y-6 pt-3">
                    {ownership_description && (
                        <div>
                            <h3 className="text-lg font-bold text-ink mb-2">Struktura właścicielska</h3>
                            <Paragraphs text={ownership_description} />
                        </div>
                    )}
                    {business_description && (
                        <div>
                            <h3 className="text-lg font-bold text-ink mb-2">O firmie</h3>
                            <Paragraphs text={business_description} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
