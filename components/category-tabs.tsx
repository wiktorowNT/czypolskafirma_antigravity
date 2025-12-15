"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
}

interface CategoryTabsProps {
  categories: Category[]
  className?: string
}

export function CategoryTabs({ categories, className }: CategoryTabsProps) {
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return LucideIcons.Tag
    const icon = LucideIcons[iconName as keyof typeof LucideIcons]
    return icon && typeof icon === "function" ? icon : LucideIcons.Tag
  }

  return (
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-white p-4 shadow-sm">
        <div className="flex w-max space-x-4 p-1">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon)
            return (
              <Link
                key={category.id}
                href={`/kategoria/${category.slug}`}
                className={cn(
                  "inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                  "hover:border-red-200 hover:shadow-sm"
                )}
              >
                <IconComponent className="mr-2 h-4 w-4" />
                {category.name}
              </Link>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
