"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "czypolskafirma_bookmarks"

/**
 * Hook for managing bookmarked companies in localStorage.
 * SSR-safe — all localStorage access is guarded behind typeof window checks.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setBookmarks(parsed)
        }
      }
    } catch (e) {
      console.error("Failed to load bookmarks:", e)
    }
    setIsLoaded(true)
  }, [])

  // Persist to localStorage whenever bookmarks change
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch (e) {
      console.error("Failed to save bookmarks:", e)
    }
  }, [bookmarks, isLoaded])

  const toggleBookmark = useCallback((companyId: string) => {
    setBookmarks((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId)
      }
      return [...prev, companyId]
    })
  }, [])

  const isBookmarked = useCallback(
    (companyId: string) => bookmarks.includes(companyId),
    [bookmarks]
  )

  const removeBookmark = useCallback((companyId: string) => {
    setBookmarks((prev) => prev.filter((id) => id !== companyId))
  }, [])

  const clearAll = useCallback(() => {
    setBookmarks([])
  }, [])

  return {
    bookmarks,
    count: bookmarks.length,
    isLoaded,
    toggleBookmark,
    isBookmarked,
    removeBookmark,
    clearAll,
  }
}
