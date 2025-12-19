"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { CompanyLogo } from "@/components/company-logo"

interface Company {
  id: string
  brand: string
  company: string
  category: string
  categorySlug: string
  website_url?: string
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
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Company[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchResult, setSearchResult] = useState<Company | null>(null)
  const [showNoResults, setShowNoResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
          setIsOpen(data.length > 0)
        } else {
          setSuggestions([])
          setIsOpen(false)
        }
      } catch (error) {
        console.error("Search error:", error)
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
      setSelectedIndex(-1)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSearch = () => {
    if (query.trim().length === 0) return

    if (onDemoSearch) {
      onDemoSearch()
      return
    }

    // Redirect to search results page with query
    router.push(`/szukaj?q=${encodeURIComponent(query.trim())}`)
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
            className={`w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${showButton ? "h-12 text-base" : ""
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
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors ${index === selectedIndex ? "bg-slate-50" : ""
                }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center">
                {/* Company Logo */}
                <CompanyLogo
                  websiteUrl={company.website_url}
                  name={company.brand}
                  size={40}
                  className="mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{company.brand}</div>
                  <div className="text-sm text-slate-500 truncate">{company.company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{company.category}</div>
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
