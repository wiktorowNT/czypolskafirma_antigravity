"use client"

import { useState, useEffect } from "react"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const cookieChoice = localStorage.getItem("cookies-choice")
    if (!cookieChoice) {
      setIsVisible(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem("cookies-choice", "accepted")
    setIsVisible(false)
  }

  const acceptEssential = () => {
    localStorage.setItem("cookies-choice", "essential-only")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-[440px] bg-card text-ink border-[1.5px] border-line rounded-[20px] p-4 sm:p-5 z-50 shadow-[0_16px_40px_-16px_rgba(31,29,26,0.35)]">
      <p className="text-sm text-ink-2 leading-relaxed">
        Ta strona używa plików cookies w celach analitycznych i funkcjonalnych. Możesz zaakceptować wszystkie
        lub zezwolić tylko na niezbędne pliki cookies.
      </p>
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <button
          onClick={acceptEssential}
          className="h-10 px-4 rounded-full border-[1.5px] border-line text-sm font-bold text-ink hover:border-ink transition-colors"
        >
          Tylko niezbędne
        </button>
        <button
          onClick={acceptAll}
          className="h-10 px-4 rounded-full bg-panel text-white text-sm font-bold hover:bg-black transition-colors"
        >
          Akceptuję wszystkie
        </button>
      </div>
    </div>
  )
}
