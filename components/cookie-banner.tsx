"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            Ta strona używa plików cookies w celach analitycznych i funkcjonalnych. Możesz zaakceptować wszystkie
            lub zezwolić tylko na niezbędne pliki cookies.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            onClick={acceptEssential}
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-600"
          >
            Tylko niezbędne
          </Button>
          <Button onClick={acceptAll} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            Akceptuję wszystkie
          </Button>
        </div>
      </div>
    </div>
  )
}
