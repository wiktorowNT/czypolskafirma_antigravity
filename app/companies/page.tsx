"use client"

import { useEffect, useState } from "react"
import { Building2, MapPin, TrendingUp, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Company {
  id: number
  name: string
  nip: string
  score: number
  city: string
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return "text-green-700"
  if (score >= 40) return "text-yellow-700"
  return "text-red-700"
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error: fetchError } = await supabase
          .from("companies")
          .select("*")
          .order("score", { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setCompanies(data || [])
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-10 w-64 bg-slate-200 rounded animate-pulse mb-4" />
            <div className="h-6 w-96 bg-slate-200 rounded animate-pulse" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-3" />
                    <div className="flex gap-4">
                      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-12 w-24 bg-slate-200 rounded-full animate-pulse" />
                </div>
              </div>
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Lista firm</h1>
          <p className="text-lg text-slate-600">Przeglądaj wszystkie firmy z bazy danych ({companies.length} firm)</p>
        </div>

        {/* Companies List */}
        {companies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-200">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Brak firm w bazie</h3>
            <p className="text-slate-600">Nie znaleziono żadnych firm w bazie danych</p>
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Company Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{company.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{company.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span>NIP: {company.nip}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="lg:w-48">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Wynik
                      </span>
                      <span className={`text-sm font-bold ${getScoreTextColor(company.score)}`}>
                        {company.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getScoreColor(company.score)} transition-all duration-300`}
                        style={{ width: `${company.score}%` }}
                        role="progressbar"
                        aria-valuenow={company.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Wynik ${company.name}: ${company.score} na 100`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
