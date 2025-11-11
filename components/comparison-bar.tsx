"use client"

import { X } from "lucide-react"

interface CategoryItem {
  id: string
  brand: string
  company: string
  score: number
  badges: string[]
  logo?: string
  logoUrl?: string
  logoDarkUrl?: string
  brandColor?: string
}

interface ComparisonBarProps {
  comparedCompanies: string[]
  companies: CategoryItem[]
  onRemove: (companyId: string) => void
  onClear: () => void
  onCompare: () => void
}

export default function ComparisonBar({
  comparedCompanies,
  companies,
  onRemove,
  onClear,
  onCompare,
}: ComparisonBarProps) {
  if (comparedCompanies.length === 0) return null

  const selectedCompanies = comparedCompanies
    .map((id) => companies.find((company) => company.id === id))
    .filter(Boolean) as CategoryItem[]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 animate-in slide-in-from-bottom-2 duration-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-900">Porównanie ({comparedCompanies.length}/3)</span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {selectedCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200"
                >
                  <span className="text-slate-900">{company.brand}</span>
                  <button
                    onClick={() => onRemove(company.id)}
                    className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClear}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Wyczyść
            </button>
            <button
              onClick={onCompare}
              disabled={comparedCompanies.length < 2}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Porównaj ({comparedCompanies.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
