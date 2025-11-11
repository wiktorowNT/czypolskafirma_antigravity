import { CheckCircle, Building, CreditCard, Factory, Users, Beaker, Award } from "lucide-react"

export function PolishIndex() {
  const criteria = [
    { name: "Kapitał/beneficjent rzeczywisty", weight: 40, icon: Building },
    { name: "Siedziba prawna", weight: 15, icon: Building },
    { name: "Podatki (CIT) płacone w PL", weight: 15, icon: CreditCard },
    { name: "Produkcja/łańcuch dostaw w PL", weight: 10, icon: Factory },
    { name: "Zatrudnienie w PL", weight: 10, icon: Users },
    { name: "R&D w PL", weight: 5, icon: Beaker },
    { name: "Pochodzenie marki", weight: 5, icon: Award },
  ]

  return (
    <section id="polish-index" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Czym jest Indeks polskości?</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Indeks 0–100 obliczany na podstawie kryteriów i publicznych źródeł. Pokazujemy składniki punktacji i linki
            do źródeł, abyś mógł sam wyrobić zdanie.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Criteria */}
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-8">Kryteria oceny</h3>
            <div className="space-y-6">
              {criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <criterion.icon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-900">{criterion.name}</span>
                      <span className="text-sm text-slate-600">{criterion.weight}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${criterion.weight * 2}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-slate-900">Przykładowa Marka S.A.</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">72/100</div>
                <div className="text-sm text-slate-500">Indeks polskości</div>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-4 mb-6">
              <div className="bg-green-500 h-4 rounded-full" style={{ width: "72%" }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>&gt;50% kapitału PL</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-green-500" />
                <span>Siedziba w PL</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-green-500" />
                <span>CIT w PL: tak</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Factory className="h-4 w-4 text-yellow-500" />
                <span>Produkcja: częściowo</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-900 mb-2">Struktura właścicielska</h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Marka → Przykładowa Marka S.A.</div>
                <div>Spółka → Holding ABC Sp. z o.o.</div>
                <div>Beneficjent → Jan Kowalski (PL)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
