"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Heart } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const categoriesRef = useRef<HTMLDivElement>(null)
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
    if (pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    } else {
      window.location.href = `/#${id}`
    }
    setIsMenuOpen(false)
  }

  const handleLogoClick = () => {
    if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" })
    else router.push("/")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoriesOpen(false)
        categoriesButtonRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div
              onClick={handleLogoClick}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleLogoClick()
                }
              }}
            >
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <img
                  src="https://flagcdn.com/w40/pl.png"
                  alt="Polska"
                  className="w-6 h-auto rounded-sm shadow-sm"
                />
                CzyPolskaFirma
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-8">
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
                    className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4"
                    onMouseLeave={() => setIsCategoriesOpen(false)}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      {categories.map((cat) => {
                        const Icon = LucideIcons[cat.icon as keyof typeof LucideIcons] || LucideIcons.Tag
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

          {/* CTA */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => scrollToSection("newsletter")}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Wesprzyj projekt
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="text-left text-slate-600 hover:text-slate-900 flex items-center justify-between"
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

              <Button
                onClick={() => scrollToSection("newsletter")}
                className="bg-red-600 hover:bg-red-700 text-white mt-4 flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Wesprzyj projekt
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
