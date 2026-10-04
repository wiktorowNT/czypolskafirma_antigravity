import { serializeJsonLd } from "@/lib/json-ld"

export function HowItWorks() {
  const steps = [
    {
      title: "Wpisz nazwę",
      description: "Wyszukaj firmę",
    },
    {
      title: "Zobacz wynik",
      description: "Kraj pochodzenia i struktura właścicielska",
    },
    {
      title: "Poznaj alternatywy",
      description: "Polskie firmy w tej samej kategorii",
    },
  ]

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Jak sprawdzić pochodzenie firmy na CzyPolskaFirma.pl",
    "description": "Prosta instrukcja jak w trzech krokach zweryfikować kapitał firmy i znaleźć polskie alternatywy.",
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.title,
      "text": step.description,
      "url": "https://czypolskafirma.pl#how-it-works"
    }))
  }

  return (
    <section id="how-it-works" className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(howToJsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-ink mb-6">Jak to działa</h2>

        <div className="grid md:grid-cols-3 gap-3.5">
          {steps.map((step, index) => (
            <div key={index} className="rounded-[20px] border-[1.5px] border-line p-5 sm:p-6">
              <div
                className={`w-9 h-9 rounded-full grid place-items-center text-sm font-extrabold mb-3.5 ${
                  index === steps.length - 1 ? "bg-sun text-ink" : "bg-panel text-white"
                }`}
                aria-hidden="true"
              >
                {index + 1}
              </div>
              <h3 className="text-lg font-bold text-ink">{step.title}</h3>
              <p className="text-[15px] text-ink-2 mt-1.5">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
