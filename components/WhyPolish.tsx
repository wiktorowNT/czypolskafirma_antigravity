"use client"

import { useState } from "react"
import { ChevronDown, TrendingUp, Users, Lightbulb, ShieldCheck } from "lucide-react"

export function WhyPolish() {
  const [isOpen, setIsOpen] = useState(false)

  const points = [
    {
      title: "Podatki zostają w Polsce",
      icon: TrendingUp,
      content: "Wybierając firmy z polskim kapitałem, masz pewność, że wypracowany zysk oraz podatki (w tym CIT) trafiają do polskiego budżetu. Te środki finansują naszą infrastrukturę, służbę zdrowia oraz edukację. Patriotyzm gospodarczy to najprostszy sposób na realne wsparcie lokalnych społeczności."
    },
    {
      title: "Stabilne miejsca pracy",
      icon: Users,
      content: "Rodzime przedsiębiorstwa są fundamentem polskiego rynku pracy. W przeciwieństwie do globalnych korporacji, które mogą przenieść produkcję do tańszych krajów w poszukiwaniu optymalizacji kosztów, polskie firmy są silnie związane z regionem. Inwestują w rozwój pracowników i budują stabilność gospodarczą kraju."
    },
    {
      title: "Rozwój innowacji i technologii",
      icon: Lightbulb,
      content: "Wspierając polskie marki, dajesz im kapitał na badania i rozwój. Dzięki temu nasze firmy mogą konkurować na rynkach międzynarodowych, promując polską myśl techniczną i design. Każdy zakup to \"głos\" oddany na rozwój polskiej marki, która może stać się globalnym liderem."
    },
    {
      title: "Bezpieczeństwo łańcucha dostaw",
      icon: ShieldCheck,
      content: "Korzystanie z usług lokalnych dostawców skraca łańcuchy dostaw, co jest kluczowe w dobie globalnych kryzysów. Polskie firmy produkujące na miejscu są bardziej odporne na zawirowania polityczne i transportowe, co gwarantuje nam wszystkim większe bezpieczeństwo konsumenckie."
    }
  ]

  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full group flex flex-col items-center text-center focus:outline-none"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
            Dlaczego warto wybierać polskie firmy?
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Kliknij, aby dowiedzieć się więcej o znaczeniu patriotyzmu gospodarczego
          </p>
          <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="mt-12 grid gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {points.map((point, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{point.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {point.content}
                  </p>
                </div>
              </div>
            ))}
            <div className="text-center mt-4 p-6 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-sm text-red-800 font-medium">
                Wspieranie polskiego biznesu to inwestycja w naszą wspólną przyszłość. 
                Twoje codzienne wybory zakupowe mają realny wpływ na siłę polskiej gospodarki.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
