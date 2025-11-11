import { Shield, Filter, Lightbulb, Bell, Puzzle, Code } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Shield,
      title: "Transparentne źródła i cytowania",
      description: "Każda informacja z linkiem do źródła i datą weryfikacji",
    },
    {
      icon: Filter,
      title: "Filtry i odznaki",
      description: "Kapitał PL, produkcja w PL, podatki w PL i więcej",
    },
    {
      icon: Lightbulb,
      title: "Polskie alternatywy",
      description: "W każdej kategorii znajdziesz polskie marki",
    },
    {
      icon: Bell,
      title: "Powiadomienia o zmianach",
      description: "Dowiedz się o zmianach właściciela (wkrótce)",
    },
    {
      icon: Puzzle,
      title: "Wtyczka do przeglądarki",
      description: "Sprawdzaj polskość podczas zakupów (wkrótce)",
    },
    {
      icon: Code,
      title: "API dla firm i mediów",
      description: "Integruj nasze dane ze swoimi systemami (wkrótce)",
    },
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Funkcje</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4 group-hover:bg-red-200 transition-colors">
                <feature.icon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
