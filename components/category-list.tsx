"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface CategoryItem {
  id: string
  brand: string
  company: string
  score: number
  badges: string[]
  logo?: string
}

interface Category {
  slug: string
  name: string
  short: string
  items: CategoryItem[]
}

interface CategoryListProps {
  category?: Category
  items?: CategoryItem[]
}

const badgeLabels: Record<string, string> = {
  PL_CAPITAL_50: ">50% kapitału PL",
  HQ_PL: "Siedziba w PL",
  CIT_PL: "CIT w PL: tak",
  EMPLOYMENT_PL: "Zatrudnia w PL",
  BRAND_FROM_PL: "Marka z PL",
  COOP: "Spółdzielnia",
  COOP_NETWORK: "Sieć partnerska",
  PRODUCTION_PL_PARTIAL: "Produkcja: częściowo w PL",
  RD_PL: "B+R w PL",
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return "text-green-700"
  if (score >= 40) return "text-yellow-700"
  return "text-red-700"
}

export default function CategoryList({ category, items }: CategoryListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  const categoryItems = category?.items || items || []

  const filteredAndSortedItems = useMemo(() => {
    const filtered = categoryItems.filter(
      (item) =>
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return filtered.sort((a, b) => {
      return sortOrder === "desc" ? b.score - a.score : a.score - b.score
    })
  }, [categoryItems, searchTerm, sortOrder])

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  return (
    <div>
      {category && (
        <>
          {/* Breadcrumbs */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="/" className="text-slate-700 hover:text-red-600 transition-colors">
                  Strona główna
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-slate-400">/</span>
                  <span className="text-slate-500">{category.name}</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{category.name}</h1>
            <p className="text-lg text-slate-600">{category.short}</p>
          </div>
        </>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Szukaj po nazwie marki lub spółki..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              aria-label="Wyszukaj firmy"
            />
          </div>

          {/* Sort */}
          <button
            onClick={toggleSort}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
            aria-label={`Sortuj według indeksu ${sortOrder === "desc" ? "rosnąco" : "malejąco"}`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm font-medium">Indeks {sortOrder === "desc" ? "malejąco" : "rosnąco"}</span>
            {sortOrder === "desc" ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-slate-600">
          Znaleziono {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? "firmę" : "firm"}
        </p>
      </div>

      {/* Company List */}
      <ul className="space-y-4" role="list">
        {filteredAndSortedItems.map((item) => (
          <li key={item.id}>
            <Link
              href={`/firma/${item.id}`}
              className="block bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
              aria-label={`Profil firmy ${item.brand}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {item.logo && (
                      <img
                        src={item.logo || "/placeholder.svg"}
                        alt={`Logo ${item.brand}`}
                        className="w-10 h-10 object-contain rounded-md bg-white border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    )}
                    <h3 className="text-lg font-semibold text-slate-900">{item.brand}</h3>
                  </div>
                  <p className="text-slate-600 mb-3">({item.company})</p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {item.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                      >
                        {badgeLabels[badge] || badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score */}
                <div className="lg:w-48">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Indeks polskości</span>
                    <span className={`text-sm font-bold ${getScoreTextColor(item.score)}`}>{item.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreColor(item.score)}`}
                      style={{ width: `${item.score}%` }}
                      role="progressbar"
                      aria-valuenow={item.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Indeks polskości ${item.brand}: ${item.score} na 100`}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* No results */}
      {filteredAndSortedItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">Nie znaleziono firm pasujących do wyszukiwania "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}
