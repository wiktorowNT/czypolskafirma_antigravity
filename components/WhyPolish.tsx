"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function WhyPolish() {
  const [isOpen, setIsOpen] = useState(false)

  const points = [
    {
      title: "Podatki zostają w Polsce",
      content: "Wybierając firmy z polskim kapitałem, masz pewność, że wypracowany zysk oraz podatki (w tym CIT) trafiają do polskiego budżetu. Te środki finansują naszą infrastrukturę, służbę zdrowia oraz edukację. Patriotyzm gospodarczy to prosty sposób na realne wsparcie rozwoju Polski."
    },
    {
      title: "Stabilne miejsca pracy",
      content: "Polskie przedsiębiorstwa są fundamentem rodzimego rynku pracy. W przeciwieństwie do globalnych korporacji, które mogą przenieść produkcję do tańszych krajów w poszukiwaniu optymalizacji kosztów, polskie firmy są silniej związane z Polską. Inwestują w rozwój pracowników i budują stabilność gospodarczą kraju."
    },
    {
      title: "Rozwój innowacji i technologii",
      content: "Wybierając rodzime marki, dostarczasz im kapitał niezbędny do prowadzenia badań i wdrażania nowych technologii. Dzięki temu polskie firmy skutecznie konkurują na międzynarodowych rynkach, promując polską myśl techniczną. Twój zakup to realne wsparcie, które pozwala lokalnym przedsiębiorstwom stawać się globalnymi liderami."
    },
    {
      title: "Bezpieczeństwo łańcucha dostaw",
      content: "Korzystanie z usług lokalnych dostawców skraca łańcuchy dostaw, co jest kluczowe w dobie globalnych kryzysów. Polskie firmy produkujące na miejscu są bardziej odporne na zawirowania geopolityczne, co gwarantuje nam wszystkim większe bezpieczeństwo konsumenckie."
    }
  ]

  return (
    <section className="pb-14 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[20px] border-[1.5px] border-line">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="w-full flex items-center justify-between gap-4 text-left px-5 py-5 sm:px-6"
          >
            <span>
              <h2 className="text-xl sm:text-[22px] font-extrabold tracking-tight text-ink">
                Dlaczego warto wybierać polskie firmy?
              </h2>
              <span className="block text-sm text-ink-2 mt-1">
                Cztery powody, dla których pochodzenie kapitału ma znaczenie
              </span>
            </span>
            <ChevronDown className={`w-5 h-5 flex-shrink-0 text-ink-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="px-5 pb-6 sm:px-6 grid md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              {points.map((point) => (
                <div key={point.title} className="rounded-2xl bg-warm p-5">
                  <h3 className="text-base font-bold text-ink mb-1.5">{point.title}</h3>
                  <p className="text-[15px] text-ink-2 leading-relaxed">{point.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
