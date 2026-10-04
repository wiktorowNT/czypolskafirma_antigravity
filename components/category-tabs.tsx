"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/components/category-icon"
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
  const getIconComponent = (iconName: string | null) => getCategoryIcon(iconName)

  return (
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-white p-4">
        <div className="flex w-max space-x-4 p-1">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon)
            return (
              <Link
                key={category.id}
                href={`/kategoria/${category.slug}`}
                className={cn(
                  "inline-flex items-center justify-center rounded-full border border-line bg-warm px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-warm hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2",
                  "hover:border-brand/30"
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
