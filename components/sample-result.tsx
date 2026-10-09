import type { ReactNode } from "react"
import Link from "next/link"
import { CompanyLogo } from "@/components/company-logo"
import { VerdictTag } from "@/components/verdict-tag"
import { getCountryName } from "@/lib/company-faq"
import type { SampleCompany } from "@/lib/home-data"

function formatDate(iso: string | null): string | null {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function ChainNode({ label, title, right, tone }: { label: string; title: string; right?: ReactNode; tone?: "pl" | "foreign" }) {
    const box =
        tone === "pl" ? "border-brand bg-brand-soft" : tone === "foreign" ? "border-graphite bg-card" : "border-line bg-card"
    const lab = tone === "pl" ? "text-brand-ink" : tone === "foreign" ? "text-ink" : "text-ink-3"
    return (
        <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 items-center rounded-2xl border-[1.5px] px-3.5 py-2.5 ${box}`}>
            <div className="min-w-0">
                <div className={`text-[10.5px] font-extrabold uppercase tracking-[0.06em] ${lab}`}>{label}</div>
                <div className="text-[15px] font-bold text-ink truncate">{title}</div>
            </div>
            {right}
        </div>
    )
}

function Connector({ text }: { text: string }) {
    return (
        <div className="relative h-6 ml-5 border-l-2 border-dashed border-ink-3" aria-hidden="true">
            <span className="absolute left-2.5 top-0.5 text-[11.5px] font-bold text-ink-2">{text}</span>
        </div>
    )
}

/**
 * Karta „Przykładowy wynik” na stronie głównej: najpopularniejsza firma
 * z rozpisaną ścieżką właściciela + lista „Też zaskakują”. Dane: lib/home-data.ts.
 */
export function SampleResult({ sample, surprises }: { sample: SampleCompany; surprises: SampleCompany[] }) {
    const code = sample.country_code?.toUpperCase() || null
    const isPl = code === "PL"
    const verified = formatDate(sample.verifiedAt)
    const showParent = sample.parentCompanyName && sample.parentCompanyName !== sample.ownerName

    return (
        <div className="bg-card border-[1.5px] border-line rounded-[24px] p-4 sm:p-5 grid gap-3.5" aria-label="Przykładowy wynik z bazy">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 whitespace-nowrap">
                    Przykładowy wynik
                </span>
                {verified && (
                    <span className="inline-flex items-center h-[26px] px-2.5 rounded-full bg-warm text-xs font-bold text-ink-2 whitespace-nowrap tabular-nums">
                        <span className="hidden sm:inline">Weryfikacja&nbsp;</span>
                        {verified}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 items-center">
                <CompanyLogo websiteUrl={sample.website_url} name={sample.displayName} size={48} />
                <div className="min-w-0">
                    <Link href={`/firma/${sample.slug}`} className="block text-[22px] font-extrabold tracking-tight leading-tight text-ink hover:underline underline-offset-4 truncate">
                        {sample.displayName}
                    </Link>
                    {sample.categoryName && <span className="text-[13px] font-semibold text-ink-2">{sample.categoryName}</span>}
                </div>
                <div className="col-start-2 sm:col-start-3 justify-self-start sm:justify-self-end">
                    <VerdictTag countryCode={code} label={isPl ? "Polska firma" : "Zagraniczna"} />
                </div>
            </div>

            <div className="bg-warm rounded-[18px] p-3">
                <ChainNode
                    label="Ostateczny właściciel"
                    title={sample.ownerName || "Brak danych"}
                    tone={isPl ? "pl" : "foreign"}
                    right={
                        code ? (
                            <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                                <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" width={18} height={13} className="rounded-[3px]" />
                                <span className="hidden sm:inline">{getCountryName(code)}</span>
                                <span className="sm:hidden">{code}</span>
                            </span>
                        ) : null
                    }
                />
                <Connector text="kontroluje" />
                {showParent && (
                    <>
                        <ChainNode label="Spółka-matka" title={sample.parentCompanyName!} />
                        <Connector text="posiada" />
                    </>
                )}
                {/* Potoczna nazwa marki („Pepco”), nie pełna nazwa spółki z KRS — ta jest na profilu */}
                <ChainNode label="Marka na polskim rynku" title={sample.displayName} />
            </div>

            {surprises.length > 0 && (
                <div>
                    <div className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mb-1">Też zaskakują</div>
                    {surprises.map((s, i) => {
                        const sc = s.country_code?.toUpperCase() || null
                        return (
                            <Link
                                key={s.id}
                                href={`/firma/${s.slug}`}
                                className={`grid grid-cols-[32px_minmax(0,1fr)_auto] gap-2.5 items-center py-2 group ${i > 0 ? "border-t border-line" : ""}`}
                            >
                                <CompanyLogo websiteUrl={s.website_url} name={s.displayName} size={32} />
                                <span className="min-w-0">
                                    <b className="block text-[14.5px] font-bold text-ink truncate group-hover:underline underline-offset-4">{s.displayName}</b>
                                    <small className="block text-xs font-semibold text-ink-2 truncate">{s.ownerName}</small>
                                </span>
                                {sc && <VerdictTag countryCode={sc} label={getCountryName(sc)} size="sm" />}
                            </Link>
                        )
                    })}
                </div>
            )}

            <Link
                href={`/firma/${sample.slug}`}
                className="inline-flex items-center justify-center h-11 rounded-full border-[1.5px] border-line text-[15px] font-bold text-ink hover:border-ink transition-colors"
            >
                Zobacz pełny profil: {sample.displayName} →
            </Link>
        </div>
    )
}
