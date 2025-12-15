import { CheckCircle2, ShieldCheck } from "lucide-react"

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
    <section id="methodology" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 rounded-xl mb-6">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Metodologia i źródła</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Korzystamy wyłącznie z publicznych lub oficjalnych źródeł. Każda informacja ma link i datę weryfikacji.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-xl font-semibold text-slate-900 mb-8 text-center flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Sprawdzone źródła danych
          </h3>
          <ul className="grid md:grid-cols-2 gap-4">
            {sources.map((source, index) => (
              <li
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div className="mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-slate-700 text-sm font-medium leading-relaxed">
                  {source}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
