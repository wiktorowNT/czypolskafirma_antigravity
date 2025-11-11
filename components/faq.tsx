"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Co to jest Indeks polskości?",
      answer:
        "Indeks polskości to punktacja od 0 do 100, która pokazuje jak bardzo firma lub marka jest związana z Polską. Uwzględniamy właścicieli, siedzibę, podatki, produkcję i inne kryteria.",
    },
    {
      question: "Skąd pochodzą dane?",
      answer:
        "Korzystamy wyłącznie z publicznych źródeł: KRS, CRBR, CEIDG, GUS, sprawozdań finansowych, decyzji UOKiK oraz oficjalnych stron firm. Każda informacja ma link do źródła.",
    },
    {
      question: "Jak często aktualizujecie informacje?",
      answer:
        "Dane aktualizujemy regularnie, szczególnie po zmianach właścicielskich. Pokazujemy datę ostatniej weryfikacji każdej informacji.",
    },
    {
      question: "Czy współpracujecie z firmami/mediami (API)?",
      answer:
        "Planujemy udostępnienie API dla mediów, firm i organizacji. Jeśli jesteś zainteresowany współpracą, skontaktuj się z nami.",
    },
    {
      question: "Czy oceniacie produkty czy właścicieli marek?",
      answer:
        "Oceniamy strukturę właścicielską marek i firm, nie jakość produktów. Pokazujemy fakty o właścicielach, siedzibie, podatkach i produkcji.",
    },
    {
      question: "Jak mogę zgłosić błąd?",
      answer:
        "Użyj formularza 'Zgłoś markę lub poprawkę' na stronie. Podaj link do źródła, które potwierdza poprawkę. Sprawdzimy i zaktualizujemy dane.",
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Najczęściej zadawane pytania</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
