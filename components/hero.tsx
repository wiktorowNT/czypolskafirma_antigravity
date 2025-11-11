"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import * as LucideIcons from "lucide-react"
import { CompanySearch } from "@/components/company-search"

export default function Hero() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories")
        if (!response.ok) throw new Error("Błąd pobierania kategorii")
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Błąd ładowania kategorii:", error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return LucideIcons.Tag
    const icon = LucideIcons[iconName as keyof typeof LucideIcons]
    return icon && typeof icon === "function" ? icon : LucideIcons.Tag
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative py-12 lg:py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Sprawdź, czy firma jest polska
          </h1>

          <p className="text-lg text-slate-600 mb-8">
            Indeks polskości na podstawie publicznych źródeł.
          </p>

          <div className="max-w-2xl mx-auto mb-8">
            <CompanySearch
              placeholder="Szukaj firmy lub marki..."
              showButton={true}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button
              onClick={() => scrollToSection("newsletter")}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
            >
              Dołącz do listy oczekujących
            </Button>
            <Button
              onClick={() => scrollToSection("polish-index")}
              variant="outline"
              className="px-6 py-3 border-slate-300 hover:bg-slate-50"
            >
              Jak liczymy indeks
            </Button>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Kategorie firm
              </h2>
              <p className="text-sm text-slate-500">
                Lista generowana dynamicznie z bazy Supabase.
              </p>
            </div>

            {!loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon)
                  return (
                    <section
                      key={category.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                    >
                      <Link
                        href={`/kategoria/${category.slug}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 mb-3 hover:text-red-600 transition-colors">
                          <IconComponent className="h-5 w-5 text-slate-600" />
                          <h3 className="font-semibold text-slate-900">
                            {category.name}
                          </h3>
                        </div>
                      </Link>
                      <p className="text-sm text-slate-600 mb-4">
                        {category.description || "Brak opisu"}
                      </p>
                      <Link
                        href={`/kategoria/${category.slug}`}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Zobacz więcej →
                      </Link>
                    </section>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">Ładowanie kategorii...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
