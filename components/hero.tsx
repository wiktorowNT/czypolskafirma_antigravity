"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import * as LucideIcons from "lucide-react"
import { ChevronDown } from "lucide-react"
import { CompanySearch } from "@/components/company-search"
import { CategoryTabs } from "@/components/category-tabs"
import { CompanyLogo } from "@/components/company-logo"

export default function Hero() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companyCount, setCompanyCount] = useState<number | null>(null)
  const [popularTags, setPopularTags] = useState<{ id: string; displayName: string; website_url: string | null; country_code: string | null }[]>([])
  const [popularLoading, setPopularLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories")
        if (!response.ok) throw new Error("Błąd pobierania kategorii")
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Błąd ładowania kategorii:", error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    async function fetchCompanyCount() {
      try {
        const response = await fetch("/api/companies/count")
        if (response.ok) {
          const data = await response.json()
          setCompanyCount(data.count)
        }
      } catch (error) {
        console.error("Błąd pobierania liczby firm:", error)
      }
    }

    async function fetchPopularCompanies() {
      try {
        const response = await fetch("/api/companies/views?top=6&days=30")
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            setPopularTags(data.map((c: any) => ({
              id: c.id,
              displayName: c.name || (c.slug
                ? c.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                : 'Nieznana firma'),
              website_url: c.website_url || null,
              country_code: c.country_code || null,
            })))
          }
        }
      } catch (error) {
        console.error("Błąd pobierania popularnych firm:", error)
      } finally {
        setPopularLoading(false)
      }
    }

    fetchCategories()
    fetchCompanyCount()
    fetchPopularCompanies()
  }, [])



  return (
    <section className="relative py-12 lg:py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Company Counter */}
          {companyCount !== null && companyCount > 0 && (
            <p className="text-sm font-medium text-red-600 mb-3">
              Prześwietliliśmy już {companyCount.toLocaleString('pl-PL')} firm
            </p>
          )}

          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            Sprawdź, czy firma jest polska
          </h1>
          <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
            Wybieraj świadomie — sprawdź, z jakiego kraju jest dana firma, kto za nią stoi i jaki ma wpływ na polską gospodarkę.
          </p>



          <div className="max-w-2xl mx-auto mb-4">
            <CompanySearch
              placeholder="Szukaj firmy..."
              showButton={true}
            />
          </div>

          {/* Popular Tags */}
          {popularLoading ? (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <span className="text-sm text-slate-500">Popularne wyszukiwania:</span>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`animate-pulse inline-flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-100 border border-slate-200 rounded-full shadow-sm${i >= 4 ? " hidden sm:inline-flex" : ""
                    }`}
                >
                  <div className="w-6 h-6 bg-slate-200 rounded-full" />
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : popularTags.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <span className="text-sm text-slate-500">Popularne wyszukiwania:</span>
              {popularTags.map((tag, index) => (
                <Link
                  key={tag.id}
                  href={`/firma/${tag.id}`}
                  className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 text-sm font-medium bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm${index >= 3 ? " hidden sm:inline-flex" : ""
                    }`}
                >
                  <CompanyLogo
                    websiteUrl={tag.website_url}
                    name={tag.displayName}
                    size={24}
                    className="rounded-full"
                  />
                  {tag.displayName}
                  {tag.country_code && (
                    <img
                      src={`https://flagcdn.com/w20/${tag.country_code.toLowerCase()}.png`}
                      alt={tag.country_code}
                      className="w-4 h-auto rounded-[1px] border border-slate-200/50"
                    />
                  )}
                </Link>
              ))}
            </div>
          ) : null}



          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Kategorie firm
              </h2>
              <p className="text-sm text-slate-500">
                Wybierz kategorię, aby zobaczyć listę firm
              </p>
            </div>

            <div className="hidden sm:block">
              {!loading ? (
                <CategoryTabs categories={categories} className="mx-auto max-w-4xl" />
              ) : (
                <div className="mx-auto max-w-4xl">
                  <div className="w-full rounded-md border bg-white p-4 shadow-sm">
                    <div className="flex space-x-4 overflow-hidden">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 animate-pulse inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2"
                        >
                          <div className="w-4 h-4 bg-slate-200 rounded mr-2" />
                          <div className="w-20 h-4 bg-slate-200 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: categories behind toggle */}
            <div className="sm:hidden">
              {!loading && categories.length > 0 && (
                <details className="group">
                  <summary className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                    Pokaż kategorie ({categories.length})
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-3">
                    <CategoryTabs categories={categories} className="mx-auto max-w-4xl" />
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
