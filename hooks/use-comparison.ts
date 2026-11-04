"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useComparison() {
  const [comparedCompanies, setComparedCompanies] = useState<string[]>([])
  const [showComparisonPanel, setShowComparisonPanel] = useState(false)
  const hasProcessedUrl = useRef(false)

  useEffect(() => {
    // Only process URL params once on mount
    if (hasProcessedUrl.current) return

    const saved = localStorage.getItem("comparedCompanies")
    // Adres czytany po zamontowaniu, nie przez useSearchParams: hook działa na stronie
    // kategorii, która jest ISR, a useSearchParams przy prerenderze wycina listę firm z HTML-a.
    const searchParams = new URLSearchParams(window.location.search)
    const urlCompare = searchParams.get("compare")
    const showComparison = searchParams.get("showComparison") === "true"

    if (urlCompare) {
      const companiesFromUrl = urlCompare.split(",").filter(Boolean)
      setComparedCompanies(companiesFromUrl)
      if (showComparison) {
        setShowComparisonPanel(true)
        // Clean URL after opening panel
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("showComparison")
        window.history.replaceState(null, "", newUrl.pathname + newUrl.search)
      }
    } else if (saved) {
      try {
        setComparedCompanies(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse compared companies from localStorage")
      }
    }

    hasProcessedUrl.current = true
  }, []) // Empty dependency array since we only want this to run once on mount

  // Save to localStorage whenever comparedCompanies changes
  useEffect(() => {
    localStorage.setItem("comparedCompanies", JSON.stringify(comparedCompanies))
  }, [comparedCompanies])

  const addToComparison = useCallback((companyId: string) => {
    setComparedCompanies((prev) => {
      if (prev.includes(companyId)) return prev
      if (prev.length >= 3) return prev
      return [...prev, companyId]
    })
    return true
  }, [])

  const removeFromComparison = useCallback((companyId: string) => {
    setComparedCompanies((prev) => prev.filter((id) => id !== companyId))
  }, [])

  const clearComparison = useCallback(() => {
    setComparedCompanies([])
    setShowComparisonPanel(false)
  }, [])

  const openComparisonPanel = useCallback(() => {
    // Only open if we have at least 2 companies
    // We'll check this in the component that calls this function
    setShowComparisonPanel(true)
  }, [])

  const closeComparisonPanel = useCallback(() => {
    setShowComparisonPanel(false)
  }, [])

  return {
    comparedCompanies,
    showComparisonPanel,
    addToComparison,
    removeFromComparison,
    clearComparison,
    openComparisonPanel,
    closeComparisonPanel,
  }
}
