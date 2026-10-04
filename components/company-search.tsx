"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { CompanyLogo } from "@/components/company-logo"

interface Company {
  id: string
  slug: string
  brand: string
  company: string
  category: string
  categorySlug: string
  website_url?: string
  country_code?: string
  /** Marka, przez którą firma pasuje do zapytania (np. "Lech" -> Kompania Piwowarska). */
  matchedBrand?: string
}

interface CompanySearchProps {
  className?: string
  placeholder?: string
  showButton?: boolean
  showSearchResult?: boolean
  variant?: "default" | "minimal" | "hero"
  onSelect?: (company: Company) => void
}

export function CompanySearch({
  className = "",
  placeholder = "Wpisz nazwę firmy lub marki...",
  showButton = false,
  onDemoSearch,
  showSearchResult = true,
  variant = "default",
  onSelect,
}: CompanySearchProps) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    // Sync logic removed for debugging
  }, [])
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
    if (onSelect) {
      onSelect(company)
    } else {
      const target = company.slug || company.id
      router.push(`/firma/${target}`)
    }
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
    return "text-brand-ink"
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
    if (onSelect) {
      onSelect(company)
    } else {
      const target = company.slug || company.id
      router.push(`/firma/${target}`)
    }
  }

  const closeSearchResult = () => {
    setSearchResult(null)
    setShowNoResults(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`relative ${showButton ? "flex gap-2" : ""}`}>
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 transform -translate-y-1/2 ${variant === "hero" ? "left-5 h-5 w-5 text-ink" : "left-3 h-4 w-4 text-ink-3"}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full focus:outline-none transition-all duration-200 ${
              variant === "hero"
                ? "h-14 sm:h-[58px] pl-14 pr-10 bg-card border-[1.5px] border-ink rounded-full text-base font-medium placeholder:text-ink-3 focus:ring-4 focus:ring-brand/15"
                : variant === "minimal"
                ? "py-2 pl-9 pr-9 bg-warm border-[1.5px] border-transparent rounded-full text-sm font-medium placeholder:text-ink-3 focus:bg-card focus:border-line"
                : "py-2 pl-10 pr-10 border-[1.5px] border-line rounded-full font-medium placeholder:text-ink-3 focus:border-ink"
            } ${showButton && variant === "default" ? "h-12 text-base" : ""}`}
            aria-label="Wyszukaj firmę"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            role="combobox"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-line border-t-brand"></div>
            </div>
          )}
          {!isLoading && query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-3 hover:text-ink-2"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showButton && (
          <button
            onClick={handleSearch}
            className={`${variant === "hero" ? "h-14 sm:h-[58px] px-5 sm:px-7 text-base" : "h-12 px-5 sm:px-6"} bg-brand text-white rounded-full hover:bg-brand-ink transition-colors font-bold flex items-center justify-center gap-2 flex-shrink-0`}
            aria-label="Szukaj"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{variant === "hero" ? "Sprawdź" : "Szukaj"}</span>
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border-[1.5px] border-line rounded-2xl shadow-[0_16px_40px_-16px_rgba(31,29,26,0.35)] z-[100] max-h-80 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((company, index) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className={`w-full text-left px-4 py-3 hover:bg-warm border-b border-line last:border-b-0 transition-colors ${index === selectedIndex ? "bg-warm" : ""
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
                  <div className="font-medium text-ink truncate flex items-center gap-2">
                    {company.brand}
                    {company.country_code && (
                      <img
                        src={`https://flagcdn.com/w40/${company.country_code.toLowerCase()}.png`}
                        alt={company.country_code}
                        className="w-5 h-auto rounded-[2px] border border-line flex-shrink-0"
                      />
                    )}
                  </div>
                  <div className="text-sm text-ink-3 truncate">{company.company}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {company.category}
                    {company.matchedBrand && (
                      <span className="text-brand-ink font-medium"> · marka: {company.matchedBrand}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchResult && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border-[1.5px] border-line rounded-2xl shadow-[0_16px_40px_-16px_rgba(31,29,26,0.35)] z-50">
          <button
            onClick={() => handleSearchResultClick(searchResult)}
            className="w-full text-left p-4 hover:bg-warm transition-colors rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink text-lg truncate">{searchResult.brand}</div>
                <div className="text-sm text-ink-3 truncate">{searchResult.company}</div>
                <div className="text-xs text-ink-3 mt-1">{searchResult.category}</div>
              </div>
            </div>

            <div className="text-xs text-ink-3">Kliknij, aby zobaczyć pełny profil firmy</div>
          </button>

          <button
            onClick={closeSearchResult}
            className="absolute top-2 right-2 text-ink-3 hover:text-ink-2 p-1"
            aria-label="Zamknij wynik wyszukiwania"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showNoResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border-[1.5px] border-line rounded-2xl shadow-[0_16px_40px_-16px_rgba(31,29,26,0.35)] z-50 p-4">
          <div className="text-center">
            <div className="text-ink-2 mb-2">Nie znaleziono firmy. Spróbuj inną nazwę.</div>
            <button onClick={closeSearchResult} className="text-sm text-brand-ink hover:text-brand-ink font-medium">
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
