// components/HeroCategoriesClient.tsx
"use client"
import { useEffect, useState } from "react"
import * as Icons from "lucide-react"
import Link from "next/link"

type Category = { id: string; name: string; slug: string; icon?: string | null }

function getIconComponent(iconName?: string | null) {
  if (!iconName) return (Icons as any).Tag
  // Convert possible slug-like names to PascalCase if needed
  // If user stored 'car' -> Car, or 'circle-dollar-sign' -> CircleDollarSign
  const parts = iconName.split(/[-_ ]+/).filter(Boolean)
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")
  return (Icons as any)[pascal] || (Icons as any).Tag
}

export default function HeroCategoriesClient() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (Array.isArray(data)) setCategories(data)
        else setError((data && data.error) || "Błąd pobierania kategorii")
      })
      .catch((e) => {
        if (!mounted) return
        setError(String(e))
      })
    return () => {
      mounted = false
    }
  }, [])

  if (error) return <div className="text-red-600">Błąd: {error}</div>
  if (!categories) return <div>Ładowanie kategorii…</div>

  return (
    <section id="categories" className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = getIconComponent(cat.icon)
            return (
              <Link
                key={cat.id}
                href={`/kategoria/${cat.slug}`}
                className="block bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md transition"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{cat.name}</h3>
                <p className="text-slate-600 mb-0">Marki i firmy z kategorii {cat.name.toLowerCase()}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
