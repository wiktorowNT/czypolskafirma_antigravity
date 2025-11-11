import { Search, BarChart3, Lightbulb } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Wpisz nazwę",
      description: "Wyszukaj firmę lub markę",
    },
    {
      icon: BarChart3,
      title: "Zobacz wynik",
      description: "Indeks polskości, właściciele, źródła",
    },
    {
      icon: Lightbulb,
      title: "Poznaj alternatywy",
      description: "Polskie marki w tej samej kategorii",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Jak to działa</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 group-hover:bg-red-200 transition-colors">
                <step.icon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
