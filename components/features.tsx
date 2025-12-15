import { ShoppingBag, Building2, Shield } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: ShoppingBag,
      title: "Świadome zakupy",
      description: "Wspieraj polską gospodarkę wybierając rodzime firmy",
    },
    {
      icon: Building2,
      title: "Weryfikacja kapitału",
      description: "Sprawdzamy strukturę właścicielską i beneficjentów rzeczywistych",
    },
    {
      icon: Shield,
      title: "Brak reklam",
      description: "Czysta i przejrzysta baza bez ukrytych sponsorów",
    },
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Dlaczego warto?</h2>
          <p className="text-lg text-slate-600">Poznaj korzyści z korzystania z naszej bazy</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="relative text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white border-4 border-red-50 rounded-full mb-6 group-hover:border-red-100 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                  <feature.icon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 max-w-xs mx-auto">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

