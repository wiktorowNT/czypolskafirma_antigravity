import { Search, BarChart3, Lightbulb } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Wpisz nazwę",
      description: "Wyszukaj firmę",
    },
    {
      icon: BarChart3,
      title: "Zobacz wynik",
      description: "Indeks polskości, właściciele, źródła",
    },
    {
      icon: Lightbulb,
      title: "Poznaj alternatywy",
      description: "Polskie firmy w tej samej kategorii",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Jak to działa</h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connector Line (Desktop only) */}
          <div className="hidden md:block absolute top-[2.5rem] left-[16%] right-[16%] h-0.5 bg-red-100 -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white border-4 border-red-50 rounded-full mb-6 group-hover:border-red-100 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                  <step.icon className="h-6 w-6 text-red-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white border-2 border-red-100 rounded-full text-sm font-bold text-red-600 shadow-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
