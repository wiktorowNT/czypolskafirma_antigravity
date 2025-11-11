import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Methodology() {
  const sources = [
    "KRS (Krajowy Rejestr Sądowy)",
    "CRBR (Centralny Rejestr Beneficjentów Rzeczywistych)",
    "CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej)",
    "GUS/REGON",
    "eKRS (sprawozdania finansowe)",
    "UOKiK (decyzje o koncentracjach)",
    "Wikidata/OpenCorporates",
    "Raporty roczne i strony internetowe firm",
  ]

  return (
    <section id="methodology" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Metodologia i źródła</h2>
          <p className="text-xl text-slate-600">
            Korzystamy wyłącznie z publicznych lub oficjalnych źródeł. Każda informacja ma link i datę weryfikacji.
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Źródła danych</h3>
          <ul className="grid md:grid-cols-2 gap-3">
            {sources.map((source, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></div>
                <span className="text-slate-700">{source}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <Button variant="outline" className="inline-flex items-center gap-2 bg-transparent">
            Pełen opis metodologii
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
