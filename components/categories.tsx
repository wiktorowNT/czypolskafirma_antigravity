"use server"

import type React from "react"
import { getAllCategoriesFromSupabase } from "@/lib/supabase/category-cache"
import * as Icons from "lucide-react"

interface Category {
  name: string
  slug: string
  icon: string | null
}

export async function Categories() {
  const categoriesData = await getAllCategoriesFromSupabase()
  const categories: Category[] = Object.values(categoriesData).sort((a, b) => a.name.localeCompare(b.name, "pl"))

  const getIconComponent = (iconName: string | null) => {
    const defaultIconName = "Tag"
    const finalIconName = iconName || defaultIconName
    const IconComponent = Icons[finalIconName as keyof typeof Icons] as React.ComponentType<{ className: string }>
    return IconComponent || Icons.Tag
  }

  return (
    <section id="categories" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Kategorie</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon)
            return (
              <div
                key={category.slug}
                className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                  <IconComponent className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{category.name}</h3>
                <p className="text-slate-600 mb-4">Marki i firmy z kategorii {category.name.toLowerCase()}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
