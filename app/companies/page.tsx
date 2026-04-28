"use client"

import { useEffect, useState } from "react"
import { Building2, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { CompanyGrid, CompanyGridItem } from "@/components/CompanyGrid"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyGridItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error: fetchError } = await supabase
          .from("companies")
          .select("id, name, slug, country_code, siedziba_pl, vat_czynny, website_url")
          .order("name", { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        const formattedData: CompanyGridItem[] = (data || []).map((c) => ({
          id: c.id,
          brand: c.slug ? c.slug.charAt(0).toUpperCase() + c.slug.slice(1) : c.name,
          country_code: c.country_code,
          headquartersInPL: c.siedziba_pl,
          vatActive: c.vat_czynny,
          logoUrl: c.logoUrl,
          website_url: c.website_url,
        }))

        setCompanies(formattedData)
      } catch (err) {
        console.error("[v0] Error fetching companies:", err)
        setError("Nie udało się załadować danych")
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <div className="h-10 w-64 bg-slate-200 rounded animate-pulse mb-4" />
            <div className="h-6 w-96 bg-slate-200 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-full h-16 shadow-sm border border-slate-200 p-2 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Wystąpił błąd</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Lista wszystkich firm</h1>
          <p className="text-base md:text-lg text-slate-600">
            Przeglądaj wszystkie firmy zweryfikowane w naszej bazie ({companies.length})
          </p>
        </div>

        {/* Companies List */}
        {companies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Brak firm w bazie</h3>
            <p className="text-slate-600">Nie znaleziono żadnych firm w bazie danych</p>
          </div>
        ) : (
          <CompanyGrid companies={companies} />
        )}
      </div>
    </div>
  )
}
