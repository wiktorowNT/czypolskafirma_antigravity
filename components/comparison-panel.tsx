"use client"

import { useState } from "react"
import { X, Copy, Check, AlertCircle, Eye, EyeOff } from "lucide-react"
import { CompanyLogo } from "@/components/company-logo"
import companyDetailsData from "@/data/company-details.json"

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

interface ComparisonPanelProps {
  isOpen: boolean
  onClose: () => void
  comparedCompanies: string[]
  companies: CategoryItem[]
  onClear: () => void
  categorySlug: string
  onRemoveCompany?: (companyId: string) => void
}

const getPolishIndexComponents = (item: CategoryItem) => {
  const companyDetails = companyDetailsData[item.id as keyof typeof companyDetailsData]

  return {
    score: {
      label: "Indeks polskości",
      value: item.score,
      type: "percentage" as const,
    },
    headquarters: {
      label: "Siedziba w PL",
      value: item.badges.includes("HQ_PL"),
      type: "boolean" as const,
    },
    vatStatus: {
      label: "VAT czynny",
      value: item.badges.includes("CIT_PL"),
      type: "boolean" as const,
    },
    bankAccount: {
      label: "Rachunek w PL",
      value:
        item.badges.includes("CIT_PL") && item.badges.includes("PL_CAPITAL_50")
          ? true
          : item.badges.includes("CIT_PL")
            ? null
            : false,
      type: "boolean" as const,
    },
    businessAge: {
      label: "Wiek działalności",
      value: companyDetails?.history
        ? new Date().getFullYear() - Number.parseInt(companyDetails.history[0]?.date || "2000")
        : null,
      type: "years" as const,
    },
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "from-green-500 to-green-600"
  if (score >= 40) return "from-yellow-500 to-orange-500"
  return "from-red-500 to-red-600"
}

export default function ComparisonPanel({
  isOpen,
  onClose,
  comparedCompanies,
  companies,
  onClear,
  categorySlug,
  onRemoveCompany,
}: ComparisonPanelProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false)

  const selectedCompanies = comparedCompanies
    .map((id) => companies.find((company) => company.id === id))
    .filter(Boolean) as CategoryItem[]

  const handleCopyLink = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set("compare", comparedCompanies.join(","))
    url.searchParams.set("showComparison", "true")

    try {
      await navigator.clipboard.writeText(url.toString())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const handleRemoveCompany = (companyId: string) => {
    if (onRemoveCompany) {
      onRemoveCompany(companyId)
    }
  }

  const getVisibleRows = () => {
    if (!showDifferencesOnly || selectedCompanies.length < 2) {
      return Object.keys(getPolishIndexComponents(selectedCompanies[0]))
    }

    return Object.keys(getPolishIndexComponents(selectedCompanies[0])).filter((key) => {
      const values = selectedCompanies.map(
        (company) => getPolishIndexComponents(company)[key as keyof ReturnType<typeof getPolishIndexComponents>].value,
      )

      // Check if all values are the same
      const firstValue = values[0]
      return !values.every((value) => {
        if (typeof firstValue === "boolean" && typeof value === "boolean") {
          return firstValue === value
        }
        if (typeof firstValue === "number" && typeof value === "number") {
          return firstValue === value
        }
        return firstValue === value
      })
    })
  }

  if (!isOpen) return null

  const visibleRows = getVisibleRows()

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-all duration-300 ease-out"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      <div className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[80vw] md:max-w-[1200px] md:h-[85vh] bg-white rounded-2xl border border-line z-50 flex flex-col animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 ease-out">
        <div className="flex items-center justify-between p-6 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-ink">Porównanie firm ({selectedCompanies.length}/3)</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 text-sm text-ink-2 hover:text-ink hover:bg-warm rounded-lg transition-colors"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-4 h-4 text-ink" />
                    <span className="text-ink">Skopiowano!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Kopiuj link
                  </>
                )}
              </button>
              {selectedCompanies.length > 1 && (
                <button
                  onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                    showDifferencesOnly
                      ? "bg-warm-2 text-ink hover:bg-blue-200"
                      : "text-ink-2 hover:text-ink hover:bg-warm"
                  }`}
                >
                  {showDifferencesOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Pokaż różnice
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-warm rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 md:p-8 min-h-0">
          {selectedCompanies.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-ink-3 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-ink mb-3">Brak firm do porównania</h3>
              <p className="text-ink-2 text-lg">Dodaj firmy do porównania, aby zobaczyć szczegóły</p>
            </div>
          ) : (
            <div className="overflow-x-auto h-full">
              <table className="w-full h-full">
                <thead>
                  <tr className="border-b-2 border-line">
                    <th className="text-left py-4 pr-8 font-semibold text-ink text-lg w-64 sticky left-0 bg-white">
                      Kryterium
                    </th>
                    {selectedCompanies.map((company) => (
                      <th key={company.id} className="text-center py-4 px-6 min-w-56">
                        <div className="flex flex-col items-center gap-3">
                          <CompanyLogo
                            id={company.id}
                            brandName={company.brand}
                            logoUrl={company.logoUrl}
                            logoDarkUrl={company.logoDarkUrl}
                            brandColor={company.brandColor}
                            size={48}
                            rounded={12}
                            priority={false}
                          />
                          <div className="text-center">
                            <div className="font-semibold text-ink text-base">{company.brand}</div>
                            <div className="text-sm text-ink-2 mt-1">{company.company}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveCompany(company.id)}
                            className="mt-2 p-1 text-ink-3 hover:text-brand hover:bg-brand-soft rounded-full transition-colors"
                            title="Usuń z porównania"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((key) => {
                    const criterionData = selectedCompanies.map(
                      (company) =>
                        getPolishIndexComponents(company)[key as keyof ReturnType<typeof getPolishIndexComponents>],
                    )

                    const isDifferent = showDifferencesOnly && selectedCompanies.length > 1

                    return (
                      <tr
                        key={key}
                        className={`border-b border-line hover:bg-warm transition-colors ${
                          isDifferent ? "bg-warm" : ""
                        }`}
                      >
                        <td className="py-5 pr-8 font-semibold text-ink text-base sticky left-0 bg-white">
                          {criterionData[0].label}
                        </td>
                        {criterionData.map((criterion, index) => (
                          <td key={index} className="text-center py-5 px-6">
                            {criterion.type === "percentage" ? (
                              <div
                                className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-bold text-lg bg-gradient-to-r ${getScoreColor(criterion.value as number)}`}
                              >
                                {criterion.value}
                              </div>
                            ) : criterion.type === "boolean" ? (
                              <div className="flex items-center justify-center">
                                {criterion.value === true ? (
                                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-ink rounded-full">
                                    <Check className="w-6 h-6" />
                                  </div>
                                ) : criterion.value === false ? (
                                  <div className="flex items-center justify-center w-10 h-10 bg-brand-soft text-brand-ink rounded-full">
                                    <X className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="text-ink-3 text-base font-medium">N/A</div>
                                )}
                              </div>
                            ) : criterion.type === "years" ? (
                              <div className="text-ink font-semibold text-base">
                                {criterion.value ? (
                                  `${criterion.value} lat`
                                ) : (
                                  <span className="text-ink-3">N/A</span>
                                )}
                              </div>
                            ) : (
                              <div className="text-ink-3 text-base font-medium">N/A</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 md:p-8 border-t border-line bg-warm flex-shrink-0">
          <button
            onClick={onClear}
            className="px-6 py-3 text-ink-2 hover:text-ink hover:bg-white rounded-lg transition-colors font-medium"
          >
            Wyczyść
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-brand text-white rounded-lg hover:bg-brand-ink transition-colors font-medium"
          >
            Zamknij
          </button>
        </div>
      </div>
    </>
  )
}
