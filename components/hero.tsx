"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import * as LucideIcons from "lucide-react"
import { ChevronDown } from "lucide-react"
import { CompanySearch } from "@/components/company-search"
import { CategoryTabs } from "@/components/category-tabs"

export default function Hero() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companyCount, setCompanyCount] = useState<number | null>(null)

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

    fetchCategories()
    fetchCompanyCount()
  }, [])

  const popularTags = [
    { name: "Komputronik", id: "9eba9af3-d53c-4969-9d9f-e3cf487e55f6" },
    { name: "Blik", id: "746ef5fa-a59f-4dd1-b0e9-2b514ebac7ce" },
    { name: "mBank", id: "da938a1e-56df-4523-b7fa-a0c4e4d9ba60" },
    { name: "Biedronka", id: "9d757d78-1ab5-4d83-90ad-de1345fd9447" },
    { name: "Auchan", id: "bd4c2ef5-fbfb-47a5-8783-ade31ce0229e" },
    { name: "Pepco", id: "ec6e9733-e0ad-4e75-99fa-01d17d6eaf2b" },
  ]



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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="text-sm text-slate-500">Popularne wyszukiwania:</span>
            {popularTags.map((tag, index) => (
              <Link
                key={tag.id}
                href={`/firma/${tag.id}`}
                className={`px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm${index >= 3 ? " hidden sm:inline-flex" : ""
                  }`}
              >
                {tag.name}
              </Link>
            ))}
          </div>



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
