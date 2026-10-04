"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { ArrowRight, ChevronDown, Globe } from "lucide-react"
import { CompanySearch } from "@/components/company-search"
import { CompanyLogo } from "@/components/company-logo"
import { SampleResult } from "@/components/sample-result"
import { countryNames } from "@/lib/countries"
import { slugify, resolveDisplayName } from "@/lib/slug-utils"
import type { HeroCategory, HeroPopularTag, SampleCompany } from "@/lib/home-data"

interface HeroProps {
  // Dane przekazane z serwera (app/page.tsx) — dzięki temu linki do /kategoria/*
  // i /firma/* renderują się w wyjściowym HTML. Fallback: fetch po stronie klienta.
  initialCategories?: HeroCategory[]
  initialCompanyCount?: number | null
  initialPopularTags?: HeroPopularTag[]
  initialRecentCompanies?: HeroPopularTag[]
  sample?: SampleCompany | null
  surprises?: SampleCompany[]
}

/** 1 firma, 2–4 firmy, 5+ firm (z wyjątkiem 12–14). */
function firmy(n: number): string {
  if (n === 1) return "firma"
  const d = n % 10
  const dd = n % 100
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return "firmy"
  return "firm"
}

/** Ile kafli kategorii widać na telefonie przed rozwinięciem. */
const MOBILE_CATEGORIES = 8

function CompanyChip({ tag }: { tag: HeroPopularTag }) {
  const code = tag.country_code?.toUpperCase()
  return (
    <Link
      href={`/firma/${tag.slug || tag.id}`}
      className="inline-flex flex-shrink-0 items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full border-[1.5px] border-line bg-card text-sm font-bold text-ink whitespace-nowrap hover:border-ink transition-colors"
    >
      <CompanyLogo websiteUrl={tag.website_url} name={tag.displayName} size={28} className="!rounded-full" />
      {tag.displayName}
      {code && (
        <img
          src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
          alt={`Flaga: ${countryNames[code] || code} — kraj pochodzenia kapitału`}
          width={16}
          height={12}
          className="rounded-[3px]"
        />
      )}
    </Link>
  )
}

export default function Hero({
  initialCategories,
  initialCompanyCount,
  initialPopularTags,
  initialRecentCompanies,
  sample,
  surprises = [],
}: HeroProps) {
  const hasInitialData = initialCategories !== undefined
  const [categories, setCategories] = useState<HeroCategory[]>(initialCategories || [])
  const [loading, setLoading] = useState(!hasInitialData)
  const [companyCount, setCompanyCount] = useState<number | null>(initialCompanyCount ?? null)
  const [popularTags, setPopularTags] = useState<HeroPopularTag[]>(initialPopularTags || [])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [country, setCountry] = useState("")

  useEffect(() => {
    if (hasInitialData) return

    async function fetchFallback() {
      try {
        const [catRes, countRes, popRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/companies/count"),
          fetch("/api/companies/views?top=6&days=30"),
        ])
        if (catRes.ok) setCategories(await catRes.json())
        if (countRes.ok) setCompanyCount((await countRes.json()).count)
        if (popRes.ok) {
          const data = await popRes.json()
          if (Array.isArray(data)) {
            setPopularTags(
              data.map((c: any) => ({
                id: c.id,
                slug: c.slug ? slugify(c.slug) : c.id,
                displayName: resolveDisplayName(c.display_name, c.slug, c.name),
                website_url: c.website_url || null,
                country_code: c.country_code || null,
              })),
            )
          }
        }
      } catch (error) {
        console.error("Błąd ładowania danych strony głównej:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchFallback()
  }, [hasInitialData])

  const searchByCountry = () => {
    const val = country.trim()
    if (val) window.location.href = `/companies?country=${encodeURIComponent(val)}`
  }

  return (
    <section className="pt-10 pb-14 sm:pt-14 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
          {/* Lewa kolumna: tytuł, wyszukiwarka, popularne */}
          <div className="min-w-0">
            {companyCount !== null && companyCount > 0 && (
              <p className="inline-flex items-center gap-2 h-8 pl-2 pr-3.5 rounded-full bg-warm text-[13px] font-bold text-ink-2">
                <span className="w-[18px] h-[18px] rounded-full bg-sun" aria-hidden="true" />
                Prześwietliliśmy już {companyCount.toLocaleString("pl-PL")} {firmy(companyCount)}
              </p>
            )}

            <h1 className="mt-4 text-[34px] sm:text-[46px] font-extrabold tracking-[-0.03em] leading-[1.08] text-ink">
              Sprawdź, czy firma jest polska
            </h1>
            <p className="mt-3 text-[17px] sm:text-lg text-ink-2 max-w-[520px]">
              Wybieraj świadomie — sprawdź, z jakiego kraju jest dana firma, kto za nią stoi i jaki ma wpływ na polską gospodarkę.
            </p>

            <div className="mt-6 max-w-[580px]">
              <CompanySearch placeholder="Wpisz markę, np. Żabka, Wedel, Reserved…" variant="hero" showButton />
              <div className="mt-2.5 flex items-center gap-2 max-w-[340px]">
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchByCountry()}
                    placeholder="Albo szukaj po kraju, np. Niemcy"
                    aria-label="Szukaj firm po kraju pochodzenia kapitału"
                    className="w-full h-10 pl-10 pr-3 rounded-full bg-warm border-[1.5px] border-transparent text-sm font-medium placeholder:text-ink-3 focus:outline-none focus:bg-card focus:border-line"
                  />
                </div>
                <button
                  onClick={searchByCountry}
                  aria-label="Szukaj po kraju"
                  className="w-10 h-10 flex-shrink-0 grid place-items-center rounded-full border-[1.5px] border-line text-ink hover:border-ink transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {popularTags.length > 0 && (
              <div className="mt-6">
                <p className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mb-2">
                  Popularne wyszukiwania
                </p>
                <div className="scroll-row flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                  {popularTags.map((tag) => (
                    <CompanyChip key={tag.id} tag={tag} />
                  ))}
                </div>
              </div>
            )}

            {initialRecentCompanies && initialRecentCompanies.length > 0 && (
              <div className="mt-4">
                <p className="text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-ink-2 mb-2">
                  Ostatnio dodane
                </p>
                <div className="scroll-row flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                  {initialRecentCompanies.map((tag) => (
                    <CompanyChip key={tag.id} tag={tag} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prawa kolumna: przykładowy wynik z bazy */}
          {sample && (
            <div className="min-w-0">
              <SampleResult sample={sample} surprises={surprises} />
            </div>
          )}
        </div>

        {/* Kategorie */}
        <div className="mt-14 sm:mt-16" id="kategorie">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 mb-5">
            <div>
              <h2 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink">Kategorie firm</h2>
              <p className="text-[15px] text-ink-2 mt-1">
                Wybierz kategorię, aby zobaczyć listę firm. Pigułka pokazuje udział polskiego kapitału.
              </p>
            </div>
            <Link href="/kategorie" className="text-sm font-bold text-brand-ink hover:underline underline-offset-4 whitespace-nowrap">
              Wszystkie kategorie →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[70px] rounded-2xl bg-warm animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {categories.map((cat, i) => {
                  const pct = cat.total ? Math.round(((cat.polish || 0) / cat.total) * 100) : null
                  return (
                    <Link
                      key={cat.id}
                      href={`/kategoria/${cat.slug}`}
                      className={`${i >= MOBILE_CATEGORIES && !showAllCategories ? "hidden sm:flex" : "flex"} flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 rounded-2xl border-[1.5px] border-line px-4 py-3.5 hover:border-ink transition-colors`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold text-ink break-words">{cat.name}</span>
                        {cat.total ? (
                          <span className="block text-[12.5px] font-semibold text-ink-3">
                            {cat.total} {firmy(cat.total)}
                          </span>
                        ) : null}
                      </span>
                      {pct !== null && (
                        <span
                          className={`self-start sm:self-auto flex-shrink-0 rounded-full px-2 py-1 text-xs font-extrabold tabular-nums ${
                            pct >= 50 ? "bg-brand-soft text-brand-ink" : "bg-warm text-ink-2"
                          }`}
                        >
                          {pct}% PL
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
              {categories.length > MOBILE_CATEGORIES && !showAllCategories && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="sm:hidden mt-3 w-full h-11 inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-line text-[15px] font-bold text-ink"
                >
                  Pokaż wszystkie kategorie ({categories.length})
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
