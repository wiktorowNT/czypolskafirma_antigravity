"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Globe2, ChevronRight } from "lucide-react"

interface StatsData {
    total: number
    polishCount: number
    foreignCount: number
    polishPercentage: number
    countryCount: number
    mostPolishCategory: {
        name: string
        slug: string
        total: number
        polish: number
        polishPercentage: number
    } | null
    leastPolishCategory: {
        name: string
        slug: string
        total: number
        polish: number
        polishPercentage: number
    } | null
}

// Animated counter hook
function useCountUp(target: number, duration = 1500, shouldStart = false) {
    const [value, setValue] = useState(0)
    const startTime = useRef<number | null>(null)

    useEffect(() => {
        if (!shouldStart || target === 0) {
            setValue(target)
            return
        }

        startTime.current = null
        let animationId: number

        function step(timestamp: number) {
            if (!startTime.current) startTime.current = timestamp
            const elapsed = timestamp - startTime.current
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))

            if (progress < 1) {
                animationId = requestAnimationFrame(step)
            }
        }

        animationId = requestAnimationFrame(step)
        return () => cancelAnimationFrame(animationId)
    }, [target, duration, shouldStart])

    return value
}

export function GlobalStats() {
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/stats")
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (err) {
                console.error("Błąd ładowania statystyk:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    // Intersection Observer for count-up animation
    useEffect(() => {
        if (!sectionRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.2 }
        )

        observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    const animatedPolishPct = useCountUp(stats?.polishPercentage ?? 0, 1500, isVisible && !loading)
    const animatedTotal = useCountUp(stats?.total ?? 0, 1500, isVisible && !loading)
    const animatedCountries = useCountUp(stats?.countryCount ?? 0, 1200, isVisible && !loading)

    if (loading) {
        return (
            <section className="py-8 bg-white border-y border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-5 bg-slate-200 rounded w-48 mx-auto mb-6" />
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-28 bg-slate-100 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    if (!stats) return null

    return (
        <section ref={sectionRef} className="py-8 bg-white border-y border-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">
                        Statystyki projektu
                    </h2>
                    <p className="text-xs text-slate-500">
                        Podsumowanie danych z naszej bazy
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-3 gap-3 auto-rows-fr">

                    {/* Card 1: Polish percentage */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-3 text-center group hover:shadow-md transition-shadow h-full flex flex-col justify-center">
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                                <img
                                    src="https://flagcdn.com/w40/pl.png"
                                    alt="PL"
                                    className="w-5 h-auto rounded-sm"
                                />
                            </div>
                            <div className="text-4xl font-extrabold text-red-600 mb-1 tabular-nums">
                                {animatedPolishPct}%
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                                firm w bazie to <strong>polskie firmy</strong>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {stats.polishCount} z {stats.total} zweryfikowanych
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Most Polish category */}
                    {stats.mostPolishCategory && (
                        <Link
                            href={`/kategoria/${stats.mostPolishCategory.slug}`}
                            className="relative overflow-hidden bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-3 text-center group hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">
                                    Najbardziej polska kategoria
                                </p>
                                <div className="text-xl font-bold text-slate-900 mb-0.5">
                                    {stats.mostPolishCategory.name}
                                </div>
                                <p className="text-sm text-slate-600">
                                    <span className="font-semibold text-green-600">{stats.mostPolishCategory.polishPercentage}%</span> polskich firm
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {stats.mostPolishCategory.polish} z {stats.mostPolishCategory.total} firm
                                </p>
                                <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Sprawdź <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* Card 3: Least Polish category */}
                    {stats.leastPolishCategory && (
                        <Link
                            href={`/kategoria/${stats.leastPolishCategory.slug}`}
                            className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-3 text-center group hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-center"
                        >
                            <div className="relative z-10">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                                    <TrendingDown className="w-5 h-5 text-amber-600" />
                                </div>
                                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                                    Najbardziej zagraniczna kategoria
                                </p>
                                <div className="text-xl font-bold text-slate-900 mb-0.5">
                                    {stats.leastPolishCategory.name}
                                </div>
                                <p className="text-sm text-slate-600">
                                    tylko <span className="font-semibold text-amber-600">{stats.leastPolishCategory.polishPercentage}%</span> polskich firm
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {stats.leastPolishCategory.polish} z {stats.leastPolishCategory.total} firm
                                </p>
                                <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Sprawdź <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}
