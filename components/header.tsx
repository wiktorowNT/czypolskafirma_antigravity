"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Heart, Search } from "lucide-react"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { CompanySearch } from "@/components/company-search"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const { count: bookmarkCount } = useBookmarks()

  const categoriesRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const categoriesButtonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories")
        if (!res.ok) throw new Error("Błąd pobierania kategorii")
        const data = await res.json()
        setCategories(data)
      } catch (err) {
        console.error("Błąd ładowania kategorii:", err)
      }
    }
    fetchCategories()
  }, [])

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false)
    setIsCategoriesOpen(false)
    if (pathname === "/") {
      // Small delay so mobile menu can animate closed
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } else {
      router.push(`/#${id}`)
    }
  }

  const handleLogoClick = () => {
    if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" })
    else router.push("/")
  }

  // Close mobile menu on scroll
  useEffect(() => {
    if (!isMenuOpen) return
    const handleScroll = () => {
      setIsMenuOpen(false)
      setIsCategoriesOpen(false)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isMenuOpen])

  // Close desktop categories dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) return
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoriesOpen(false)
        setIsMenuOpen(false)
        categoriesButtonRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Search */}
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="text-xl font-bold text-slate-900 flex items-center gap-3"
              >
                <img
                  src="/logo.png"
                  alt="CzyPolskaFirma Logo"
                  className="h-8 w-auto flex-shrink-0"
                />
                <span className="text-base sm:text-xl">CzyPolskaFirma</span>
              </Link>
            </div>

            {pathname !== "/" && (
              <div className="hidden lg:block flex-1 max-w-sm">
                <CompanySearch placeholder="Szukaj firmy..." variant="minimal" />
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <nav className="flex items-center space-x-4 lg:space-x-6">
              <div className="relative" ref={categoriesRef}>
                <button
                  ref={categoriesButtonRef}
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Kategorie
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoriesOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4 max-h-[70vh] overflow-y-auto"
                    onMouseLeave={() => setIsCategoriesOpen(false)}
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {categories.map((cat) => {
                        const iconCandidate = LucideIcons[cat.icon as keyof typeof LucideIcons]
                        const Icon = (iconCandidate && typeof iconCandidate === "function" ? iconCandidate : LucideIcons.Tag) as React.ComponentType<{ className?: string }>
                        return (
                          <Link
                            key={cat.id}
                            href={`/kategoria/${cat.slug}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                            onClick={() => setIsCategoriesOpen(false)}
                          >
                            <Icon className="h-5 w-5 text-slate-700" />
                            <div>
                              <div className="font-medium text-slate-900">{cat.name}</div>
                              {cat.description && (
                                <div className="text-sm text-slate-500">{cat.description}</div>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/companies" className="text-slate-600 hover:text-slate-900 font-medium">
                Lista firm
              </Link>
              <button onClick={() => scrollToSection("how-it-works")} className="text-slate-600 hover:text-slate-900">
                Jak to działa
              </button>
              <button onClick={() => scrollToSection("methodology")} className="text-slate-600 hover:text-slate-900">
                Metodologia
              </button>
              <button onClick={() => scrollToSection("features")} className="text-slate-600 hover:text-slate-900">
                Funkcje
              </button>
              <button onClick={() => scrollToSection("faq")} className="text-slate-600 hover:text-slate-900">
                FAQ
              </button>
            </nav>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-3">
              <Link
                href="/ulubione"
                className="relative p-2 text-slate-600 hover:text-red-600 transition-colors"
                title="Ulubione firmy"
              >
                <Heart className={`h-5 w-5 ${bookmarkCount > 0 ? "text-red-500 fill-current" : ""}`} />
                {bookmarkCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {bookmarkCount > 9 ? "9+" : bookmarkCount}
                  </span>
                )}
              </Link>
              <a
                href="https://buycoffee.to/czypolskafirma.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-red-600 text-red-600 hover:bg-red-50 h-9 px-4 py-2 gap-2"
              >
                <Heart className="h-4 w-4" />
                Wesprzyj projekt
              </a>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1">
            {pathname !== "/" && !isMobileSearchOpen && (
              <Button variant="ghost" size="sm" onClick={() => { setIsMobileSearchOpen(true); setIsMenuOpen(false) }}>
                <Search className="h-5 w-5" />
              </Button>
            )}
            <Button ref={mobileMenuButtonRef} variant="ghost" size="sm" onClick={() => { setIsMenuOpen(!isMenuOpen); setIsMobileSearchOpen(false) }}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileSearchOpen && pathname !== "/" && (
          <div className="md:hidden py-3 px-2 border-t border-slate-200">
            <CompanySearch placeholder="Szukaj firmy..." variant="minimal" />
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <>
            {/* Full-screen overlay to catch taps outside menu */}
            <div
              className="fixed inset-0 top-16 z-40 md:hidden"
              onClick={() => { setIsMenuOpen(false); setIsCategoriesOpen(false) }}
              aria-hidden="true"
            />
            <div ref={mobileMenuRef} className="relative z-50 md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="text-left text-slate-600 hover:text-slate-900 flex items-center justify-between py-2"
                >
                  Kategorie
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoriesOpen && (
                  <div className="pl-4 space-y-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/kategoria/${cat.slug}`}
                        className="block text-slate-500 hover:text-slate-700 py-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href="/companies"
                  className="text-left text-slate-600 hover:text-slate-900 py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Lista firm
                </Link>
                <button onClick={() => scrollToSection("how-it-works")} className="text-left text-slate-600 py-2">
                  Jak to działa
                </button>
                <button onClick={() => scrollToSection("methodology")} className="text-left text-slate-600 py-2">
                  Metodologia
                </button>
                <button onClick={() => scrollToSection("features")} className="text-left text-slate-600 py-2">
                  Funkcje
                </button>
                <button onClick={() => scrollToSection("faq")} className="text-left text-slate-600 py-2">
                  FAQ
                </button>

                <Link
                  href="/ulubione"
                  className="flex items-center gap-2 text-slate-600 hover:text-red-600 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart className={`h-4 w-4 ${bookmarkCount > 0 ? "text-red-500 fill-current" : ""}`} />
                  Ulubione {bookmarkCount > 0 && `(${bookmarkCount})`}
                </Link>

                <a
                  href="https://buycoffee.to/czypolskafirma.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-700 text-white mt-4 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Wesprzyj projekt
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
