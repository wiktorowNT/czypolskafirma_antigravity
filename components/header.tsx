"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Heart, Search } from "lucide-react"
import { getCategoryIcon } from "@/components/category-icon"
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
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Search */}
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="text-xl font-extrabold tracking-tight text-ink flex items-center gap-2.5"
              >
                <img
                  src="/logo.png"
                  alt="CzyPolskaFirma Logo"
                  className="h-8 w-auto flex-shrink-0"
                />
                <span className="text-[17px] sm:text-lg">CzyPolskaFirma</span>
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
            <nav className="flex items-center gap-1">
              <div className="relative" ref={categoriesRef}>
                <button
                  ref={categoriesButtonRef}
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  className="flex items-center gap-1 h-9 px-3 rounded-full text-[14.5px] font-semibold text-ink-2 hover:bg-warm hover:text-ink transition-colors"
                >
                  Kategorie
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoriesOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-card rounded-2xl border-[1.5px] border-line p-2 max-h-[70vh] overflow-y-auto shadow-[0_16px_40px_-16px_rgba(31,29,26,0.35)]"
                    onMouseLeave={() => setIsCategoriesOpen(false)}
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {categories.map((cat) => {
                        const Icon = getCategoryIcon(cat.icon)
                        return (
                          <Link
                            key={cat.id}
                            href={`/kategoria/${cat.slug}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-warm transition-colors"
                            onClick={() => setIsCategoriesOpen(false)}
                          >
                            <Icon className="h-4 w-4 text-ink-2" />
                            <div>
                              <div className="text-[14.5px] font-bold text-ink">{cat.name}</div>
                              {cat.description && (
                                <div className="text-sm text-ink-3">{cat.description}</div>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/companies"
                className={`h-9 px-3 inline-flex items-center rounded-full text-[14.5px] font-semibold transition-colors ${pathname === "/companies" ? "bg-warm text-ink" : "text-ink-2 hover:bg-warm hover:text-ink"}`}
              >
                Lista firm
              </Link>
              <Link
                href="/blog"
                className={`h-9 px-3 inline-flex items-center rounded-full text-[14.5px] font-semibold transition-colors ${pathname.startsWith("/blog") ? "bg-warm text-ink" : "text-ink-2 hover:bg-warm hover:text-ink"}`}
              >
                Blog
              </Link>
              <button onClick={() => scrollToSection("how-it-works")} className="h-9 px-3 rounded-full text-[14.5px] font-semibold text-ink-2 hover:bg-warm hover:text-ink transition-colors">
                Jak to działa
              </button>
              <button onClick={() => scrollToSection("methodology")} className="h-9 px-3 rounded-full text-[14.5px] font-semibold text-ink-2 hover:bg-warm hover:text-ink transition-colors">
                Metodologia
              </button>
              <button onClick={() => scrollToSection("faq")} className="h-9 px-3 rounded-full text-[14.5px] font-semibold text-ink-2 hover:bg-warm hover:text-ink transition-colors">
                FAQ
              </button>
            </nav>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-3">
              <Link
                href="/ulubione"
                className="relative w-10 h-10 grid place-items-center rounded-full text-ink-2 hover:bg-warm hover:text-ink transition-colors"
                title="Ulubione firmy"
              >
                <Heart className={`h-[18px] w-[18px] ${bookmarkCount > 0 ? "text-brand fill-current" : ""}`} />
                {bookmarkCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {bookmarkCount > 9 ? "9+" : bookmarkCount}
                  </span>
                )}
              </Link>
              <a
                href="https://buycoffee.to/czypolskafirma.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border-[1.5px] border-line text-sm font-bold text-ink hover:border-ink transition-colors"
              >
                <Heart className="h-4 w-4" />
                Wesprzyj projekt
              </a>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1">
            {pathname !== "/" && !isMobileSearchOpen && (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Otwórz wyszukiwarkę"
                onClick={() => { setIsMobileSearchOpen(true); setIsMenuOpen(false) }}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            <Button
              ref={mobileMenuButtonRef}
              variant="ghost"
              size="sm"
              aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={isMenuOpen}
              onClick={() => { setIsMenuOpen(!isMenuOpen); setIsMobileSearchOpen(false) }}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileSearchOpen && pathname !== "/" && (
          <div className="md:hidden py-3 px-2 border-t border-line">
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
            <div ref={mobileMenuRef} className="relative z-50 md:hidden py-4 border-t border-line">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="text-left text-ink-2 hover:text-ink flex items-center justify-between py-2"
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
                        className="block text-ink-3 hover:text-ink-2 py-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href="/companies"
                  className="text-left text-ink-2 hover:text-ink py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Lista firm
                </Link>
                <Link
                  href="/blog"
                  className="text-left text-ink-2 hover:text-ink py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
                <button onClick={() => scrollToSection("how-it-works")} className="text-left text-ink-2 py-2">
                  Jak to działa
                </button>
                <button onClick={() => scrollToSection("methodology")} className="text-left text-ink-2 py-2">
                  Metodologia
                </button>
                <button onClick={() => scrollToSection("faq")} className="text-left text-ink-2 py-2">
                  FAQ
                </button>

                <Link
                  href="/ulubione"
                  className="flex items-center gap-2 text-ink-2 hover:text-brand-ink py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Heart className={`h-4 w-4 ${bookmarkCount > 0 ? "text-brand fill-current" : ""}`} />
                  Ulubione {bookmarkCount > 0 && `(${bookmarkCount})`}
                </Link>

                <a
                  href="https://buycoffee.to/czypolskafirma.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-panel hover:bg-black text-white mt-4 flex items-center justify-center gap-2 h-12 rounded-full font-bold transition-colors"
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
