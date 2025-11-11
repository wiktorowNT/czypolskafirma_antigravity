"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import categoriesData from "@/data/categories.json"

interface Company {
  id: string
  brand: string
  company: string
  score: number
  category: string
  categorySlug: string
}

interface CompanySearchProps {
  className?: string
  placeholder?: string
  showButton?: boolean
  onDemoSearch?: () => void
  showSearchResult?: boolean
}

export function CompanySearch({
  className = "",
  placeholder = "Wpisz nazwę firmy lub marki...",
  showButton = false,
  onDemoSearch,
  showSearchResult = true,
}: CompanySearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Company[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchResult, setSearchResult] = useState<Company | null>(null)
  const [showNoResults, setShowNoResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Flatten all companies from all categories
  const allCompanies: Company[] = Object.entries(categoriesData).flatMap(([categorySlug, category]) =>
    category.items.map((item) => ({
      id: item.id,
      brand: item.brand,
      company: item.company,
      score: item.score,
      category: category.name,
      categorySlug: categorySlug,
    })),
  )

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const filtered = allCompanies
      .filter(
        (company) =>
          company.brand.toLowerCase().includes(query.toLowerCase()) ||
          company.company.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 8) // Limit to 8 suggestions

    setSuggestions(filtered)
    setIsOpen(filtered.length > 0)
    setSelectedIndex(-1)
  }, [query])

  const handleSearch = () => {
    if (query.trim().length === 0) return

    if (onDemoSearch && showSearchResult) {
      // Find the company that matches the search query
      const matchedCompany = allCompanies.find(
        (company) =>
          company.brand.toLowerCase().includes(query.toLowerCase()) ||
          company.company.toLowerCase().includes(query.toLowerCase()),
      )

      if (matchedCompany) {
        setSearchResult(matchedCompany)
        setShowNoResults(false)
        setIsOpen(false)
        setQuery("")
      } else {
        setSearchResult(null)
        setShowNoResults(true)
        setIsOpen(false)
      }
      return
    }

    if (onDemoSearch) {
      onDemoSearch()
      return
    }

    // If there are suggestions and user clicks search, go to first result
    if (suggestions.length > 0) {
      handleSelectCompany(suggestions[0])
    } else {
      // Could navigate to a search results page in the future
      console.log("[v0] Search query:", query)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === "Enter") {
      e.preventDefault()
      handleSearch()
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectCompany(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelectCompany = (company: Company) => {
    setQuery("")
    setIsOpen(false)
    setSelectedIndex(-1)
    router.push(`/firma/${company.id}`)
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchResultClick = (company: Company) => {
    setSearchResult(null)
    setShowNoResults(false)
    router.push(`/firma/${company.id}`)
  }

  const closeSearchResult = () => {
    setSearchResult(null)
    setShowNoResults(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`relative ${showButton ? "flex gap-2" : ""}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              showButton ? "h-12 text-base" : ""
            }`}
            aria-label="Wyszukaj firmę"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            role="combobox"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showButton && (
          <button
            onClick={handleSearch}
            className="h-12 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium flex items-center gap-2"
            aria-label="Szukaj"
          >
            <Search className="h-4 w-4" />
            Szukaj
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((company, index) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? "bg-slate-50" : ""
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{company.brand}</div>
                  <div className="text-sm text-slate-500 truncate">{company.company}</div>
                  <div className="text-xs text-slate-400 mt-1">{company.category}</div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <div className={`text-sm font-medium ${getScoreColor(company.score)}`}>{company.score}/100</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchResult && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => handleSearchResultClick(searchResult)}
            className="w-full text-left p-4 hover:bg-slate-50 transition-colors rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-lg truncate">{searchResult.brand}</div>
                <div className="text-sm text-slate-500 truncate">{searchResult.company}</div>
                <div className="text-xs text-slate-400 mt-1">{searchResult.category}</div>
              </div>
              <div className="ml-3 flex-shrink-0 text-right">
                <div className={`text-xl font-bold ${getScoreColor(searchResult.score)}`}>{searchResult.score}/100</div>
                <div className="text-xs text-slate-500">Indeks polskości</div>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${searchResult.score >= 70 ? "bg-green-500" : searchResult.score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${searchResult.score}%` }}
              ></div>
            </div>

            <div className="text-xs text-slate-500">Kliknij, aby zobaczyć pełny profil firmy</div>
          </button>

          <button
            onClick={closeSearchResult}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1"
            aria-label="Zamknij wynik wyszukiwania"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showNoResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4">
          <div className="text-center">
            <div className="text-slate-600 mb-2">Nie znaleziono firmy. Spróbuj inną nazwę.</div>
            <button onClick={closeSearchResult} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
