"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getCountryName } from "@/lib/company-faq"
import type { HomeStats } from "@/lib/home-data"

/** Ten sam kształt co odpowiedź /api/stats (fallback, gdy brak danych z serwera). */
interface ApiStats {
    total: number
    polishCount: number
    countryCount: number
    categories: HomeStats["categories"]
}

/**
 * Koszyk 100 kwadratów: 1 kwadrat = 1% firm w bazie.
 * Kolory: polski kapitał (cegła), dwa największe kraje (grafit),
 * kolejne cztery (szarość), reszta (jasna szarość).
 */
function buildWaffle(stats: HomeStats) {
    const foreign = stats.countries.filter((c) => c.code !== "PL")
    const pct = (n: number) => (n / stats.total) * 100
    const groups = [
        { key: "pl", label: "Polska", value: pct(stats.polishCount), cls: "bg-brand" },
        { key: "top", label: foreign.slice(0, 2).map((c) => getCountryName(c.code)).join(" + "), value: pct(foreign.slice(0, 2).reduce((s, c) => s + c.count, 0)), cls: "bg-graphite" },
        { key: "mid", label: foreign.slice(2, 6).map((c) => getCountryName(c.code)).join(", "), value: pct(foreign.slice(2, 6).reduce((s, c) => s + c.count, 0)), cls: "bg-[#8f8a80]" },
        { key: "rest", label: `${Math.max(foreign.length - 6, 0)} innych krajów`, value: pct(foreign.slice(6).reduce((s, c) => s + c.count, 0)), cls: "bg-warm-2" },
    ]
    // Zaokrąglenie do 100 kwadratów metodą największych reszt
    const floors = groups.map((g) => Math.floor(g.value))
    let missing = 100 - floors.reduce((s, n) => s + n, 0)
    const order = groups.map((g, i) => ({ i, r: g.value - floors[i] })).sort((a, b) => b.r - a.r)
    for (const o of order) {
        if (missing <= 0) break
        floors[o.i]++
        missing--
    }
    return groups.map((g, i) => ({ ...g, cells: floors[i] })).filter((g) => g.cells > 0)
}

export function GlobalStats({ initialStats }: { initialStats?: HomeStats | null }) {
    const [apiStats, setApiStats] = useState<ApiStats | null>(null)

    useEffect(() => {
        if (initialStats) return
        fetch("/api/stats")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setApiStats(d))
            .catch(() => {})
    }, [initialStats])

    const stats = initialStats || apiStats
    if (!stats) return null

    const pct = stats.total > 0 ? Math.round((stats.polishCount / stats.total) * 100) : 0
    const cats = stats.categories
    const most = cats[0]
    const least = cats[cats.length - 1]
    const waffle = initialStats ? buildWaffle(initialStats) : null
    // Półki: przy wielu kategoriach pokazujemy skrajne (6 najbardziej polskich, 4 najbardziej
    // zagraniczne); pełna lista jest w kaflach kategorii wyżej na stronie.
    const shelf: (HomeStats["categories"][number] | null)[] =
        cats.length > 12 ? [...cats.slice(0, 6), null, ...cats.slice(-4)] : cats

    return (
        <section className="bg-warm py-14 sm:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h2 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink">Statystyki projektu</h2>
                    <p className="text-[15px] text-ink-2 mt-1">Podsumowanie danych z naszej bazy.</p>
                </div>

                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-10 items-start">
                    {/* Udział polskiego kapitału + koszyk */}
                    <div className="bg-card border-[1.5px] border-line rounded-[20px] p-5 sm:p-6">
                        <div className="text-[56px] sm:text-[68px] font-extrabold tracking-[-0.04em] leading-none text-brand tabular-nums">
                            {pct}%
                        </div>
                        <p className="mt-1.5 text-[15px] text-ink-2">
                            firm w bazie to <strong className="text-ink">polskie firmy</strong> — {stats.polishCount} z {stats.total} zweryfikowanych.
                        </p>

                        {waffle && (
                            <>
                                <p className="mt-5 text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2">
                                    Koszyk {stats.total} firm: skąd pochodzi kapitał
                                </p>
                                <div className="mt-3 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px] sm:gap-1" role="img" aria-label={waffle.map((g) => `${g.label}: ${g.cells}%`).join(", ")}>
                                    {waffle.flatMap((g) =>
                                        Array.from({ length: g.cells }).map((_, i) => (
                                            <i key={`${g.key}-${i}`} className={`block aspect-square rounded-[3px] ${g.cls}`} />
                                        )),
                                    )}
                                </div>
                                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-semibold text-ink-2">
                                    {waffle.map((g) => (
                                        <li key={g.key} className="inline-flex items-center gap-1.5">
                                            <i className={`inline-block w-[11px] h-[11px] rounded-[3px] ${g.cls}`} />
                                            {g.label} {g.cells}%
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Półki: udział polskiego kapitału w kategoriach */}
                    <div>
                        <p className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mb-3.5">
                            Co stoi na półce: udział polskiego kapitału w kategoriach
                        </p>
                        <div className="grid gap-2.5">
                            {shelf.map((c) => c === null ? (
                                <div key="gap" className="text-center text-ink-3 font-extrabold tracking-[0.3em] leading-none" aria-hidden="true">···</div>
                            ) : (
                                <Link
                                    key={c.slug}
                                    href={`/kategoria/${c.slug}`}
                                    className="grid grid-cols-[minmax(0,108px)_1fr_44px] sm:grid-cols-[minmax(0,130px)_1fr_48px] gap-3 items-end text-sm font-bold text-ink group"
                                >
                                    <span className="truncate pb-0.5 group-hover:underline underline-offset-4">{c.name}</span>
                                    <span className="relative h-[22px] border-b-[3px] border-ink" aria-hidden="true">
                                        <i className="absolute bottom-0 left-0 h-[18px] rounded-t-md bg-brand" style={{ width: `${c.polishPercentage}%` }} />
                                        <i className="absolute bottom-0 right-0 h-[18px] rounded-t-md bg-warm-2" style={{ width: `${Math.max(100 - c.polishPercentage - 1, 0)}%` }} />
                                    </span>
                                    <span className="text-right text-brand-ink font-extrabold tabular-nums pb-0.5">{c.polishPercentage}%</span>
                                </Link>
                            ))}
                        </div>
                        {most && least && (
                            <p className="mt-4 text-[13px] font-semibold text-ink-2">
                                Czerwone „towary” to firmy z polskim kapitałem. Najbardziej polska kategoria:{" "}
                                <Link href={`/kategoria/${most.slug}`} className="text-ink underline underline-offset-4">{most.name}</Link>{" "}
                                ({most.polish} z {most.total}). Najbardziej zagraniczna:{" "}
                                <Link href={`/kategoria/${least.slug}`} className="text-ink underline underline-offset-4">{least.name}</Link>{" "}
                                ({least.polish} z {least.total}).
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
